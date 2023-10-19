import cx_Oracle
import os
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import psutil
import datetime
from database_connection import con_oracle, connect_to_psql_112 #กรณี Run ใน Django ต้องใส่ dot . หน้า database_connection
#Recode the start time
start_time = datetime.datetime.now()
print('Start:', start_time)

#check CPU and memory start
cpu_percent_start = psutil.cpu_percent()
memory = psutil.virtual_memory()
memory_percent_start = memory.percent

#connect Oracle database
oracle_conn, from_db = con_oracle()
c = oracle_conn.cursor()
query4 = ('''
        SELECT *
        FROM
        (SELECT
            L.LOT_PRD_NAME AS PRD_NAME,
            SUBSTR(L.LOT_PRD_NAME,1,3) AS PRD_SERIES,
            FF.FACTORY_DESC AS FACTORY,
            FU.FAC_UNIT_DESC AS UNIT,
            P.PROC_DISP AS PROCESS,
            SUM(L.WO_FG_QTY - NVL((SELECT SUM(R.REJH_QTY + R.REJH_QTY_SCRAP)
                                    FROM FPC_REJECT_HEADER R
                                    WHERE L.LOT_PRD_NAME = R.REJH_PRD_NAME
                                            AND L.LOT = R.REJH_LOTNO
                                    ) , 0)) AS QTY_WIP_DETAIL
        FROM
            FPC_LOT L
        INNER JOIN FPC_PROCESS P
                ON L.PROC_ID = P.PROC_ID
        LEFT JOIN FPC_PENDING_LOT T
                ON L.LOT = T.PENL_LOT
            AND L.LOT_PENDING_ID = T.PENL_ID
        LEFT JOIN FPC_PENDING_REASON S
                ON L.LOT_PENDING_REASON = S.PENR_ID
        LEFT JOIN FPC_PENDING_GROUP G
                ON S.PENR_GROUP = G.PENG_ID
        LEFT JOIN FPC_FACTORY FF
            ON P.FACTORY_CODE = FF.FACTORY_CODE
        LEFT JOIN FPC_FACTORY_UNIT FU
            ON P.FAC_UNIT_CODE = FU.FAC_UNIT_CODE
        WHERE
            L.LOT_SCAN_FINISH IN ('N')
            AND (L.SCAN_CODE <> '00'
            OR (L.SCAN_CODE = '00'
            AND L.LOT_SCH_EFFDAT < SYSDATE))
        GROUP BY L.LOT_PRD_NAME,
            SUBSTR(L.LOT_PRD_NAME,1,3),
            FF.FACTORY_DESC,
            FU.FAC_UNIT_DESC,
            P.PROC_DISP) W
''')

c.execute(query4)
result = c.fetchall()
col_names = [desc[0] for desc in c.description]  # columns name PostgreSQL
df = pd.DataFrame(result, columns=col_names)
if len(df) > 0:
    #Check data details
    df.columns = df.columns.str.lower()
    columns_no = df.shape[1]
    rows_no = df.shape[0]
    df_size_mb = round(df.memory_usage().sum()/(1024*1024),2)
    print("data row x col: ", rows_no,'x',columns_no,'Size_MB:',df_size_mb)
    # df.to_csv('df_cfm_aoi_day.csv')
    # print(df.columns)

#Disconnect Oracle database
c.close()
oracle_conn.close()

#check CPU and memory middle
cpu_percent_middle= psutil.cpu_percent()
memory_percent_middle= memory.percent


if len(df) > 0:
    # Prepare the INSERT statement
    table_name = "pln.pln_wip_detail"
    columns = ", ".join(df.columns)
    
    insert_query = f'''
        INSERT INTO {table_name} ({columns})
        VALUES %s
        ON CONFLICT (prd_name , factory , unit , process)
        DO UPDATE
        SET prd_series = EXCLUDED.prd_series,
            qty_wip_detail = EXCLUDED.qty_wip_detail,
            update_datetime = EXCLUDED.update_datetime
    '''

    # Convert DataFrame rows to a list of tuples
    data_values = [tuple(row) for row in df.to_numpy()]

    # Execute the INSERT statement using execute_values for faster insertion
    conn, to_db = connect_to_psql_112()
    cur = conn.cursor()
    execute_values(cur, insert_query, data_values)

    # Commit the changes to the database
    conn.commit()

    query6 = ('''
    delete from pln.pln_wip_detail pwd
    where pwd.update_datetime != (select max(pwd.update_datetime)  
    from pln.pln_wip_detail pwd)
    ''')
    cur.execute(query6)
    conn.commit()

# Close the cursor and connection
del df
cur.close()
conn.close()

#Calucate_time_minutes
stop_time = datetime.datetime.now()
time_difference = (stop_time - start_time)
minutes = time_difference.total_seconds()//60
seconds = time_difference.total_seconds()%60
format_start_time = start_time.strftime("%Y-%m-%d %H:%M:%S")
format_stop_time = stop_time.strftime("%Y-%m-%d %H:%M:%S")

#check CPU and memory end
cpu_percent_end= psutil.cpu_percent()
memory_percent_end= memory.percent

print('Finished Export_data_forecast_week:{} minutes {} seconds'.format(int(minutes), int(seconds)),
      'Start_time:',format_start_time,
      'Stop_time:',format_stop_time)
print('Export_data_forecast_week %CPU(START/MID/END):',cpu_percent_start,'/',cpu_percent_middle,'/',cpu_percent_end,
      '%MEMORY(START/MID/END):',memory_percent_start,'/',memory_percent_middle,'/',memory_percent_end)