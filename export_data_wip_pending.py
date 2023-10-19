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
    SELECT W.PRD_NAME
       ,W.PRD_SERIES
       ,SUM(W.QTY_PEND) AS  QTY_PENDING
    FROM
    (SELECT
        L.LOT_PRD_NAME AS PRD_NAME,
        SUBSTR(L.LOT_PRD_NAME,1,3) AS PRD_SERIES,
        FF.FACTORY_DESC AS FACTORY,
        FU.FAC_UNIT_DESC AS UNIT,
        P.PROC_DISP AS PROCESS,
        S.PENR_NAME AS PENDING_REASON,
        L.WO_FG_QTY - NVL((SELECT SUM(R.REJH_QTY + R.REJH_QTY_SCRAP)
                                FROM FPC_REJECT_HEADER R
                                WHERE L.LOT_PRD_NAME = R.REJH_PRD_NAME
                                        AND L.LOT = R.REJH_LOTNO
                                ) , 0) AS QTY_PEND 
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
        L.LOT_SCAN_FINISH IN ('P')
        AND (L.SCAN_CODE <> '00'
        OR (L.SCAN_CODE = '00'
        AND L.LOT_SCH_EFFDAT < SYSDATE))
        AND S.PENR_ID in ('1026','1029')) W
    GROUP BY W.PRD_NAME
        ,W.PRD_SERIES
''')
c.execute(query4)
result = c.fetchall()
col_names = [desc[0] for desc in c.description]  # columns name PostgreSQL
df = pd.DataFrame(result, columns=col_names)

query5 = ('''
    SELECT *
    FROM
    (SELECT
        L.LOT_PRD_NAME AS PRD_NAME,
        L.LOt,
        SUBSTR(L.LOT_PRD_NAME,1,3) AS PRD_SERIES,
        FF.FACTORY_DESC AS FACTORY,
        FU.FAC_UNIT_DESC AS UNIT,
        P.PROC_DISP AS PROCESS,
        S.PENR_NAME AS PENDING_REASON,
        L.WO_FG_QTY - NVL((SELECT SUM(R.REJH_QTY + R.REJH_QTY_SCRAP)
                                FROM FPC_REJECT_HEADER R
                                WHERE L.LOT_PRD_NAME = R.REJH_PRD_NAME
                                        AND L.LOT = R.REJH_LOTNO
                                ) , 0) AS QTY_PENDING 
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
        L.LOT_SCAN_FINISH IN ('P')
        AND (L.SCAN_CODE <> '00'
        OR (L.SCAN_CODE = '00'
        AND L.LOT_SCH_EFFDAT < SYSDATE))
        AND S.PENR_ID in ('1026','1029')) W
''')
c.execute(query5)
result = c.fetchall()
col_names = [desc[0] for desc in c.description]  # columns name PostgreSQL
df1 = pd.DataFrame(result, columns=col_names)

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
    table_name = "pln.pln_wip_pending"
    columns = ", ".join(df.columns)
    
    insert_query = f'''
        INSERT INTO {table_name} ({columns})
        VALUES %s
        ON CONFLICT (prd_name) 
        DO UPDATE
        SET qty_pending = EXCLUDED.qty_pending,
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
    delete from pln.pln_wip_pending pwp
    where pwp.update_datetime != (select max(pwp.update_datetime)  
    from pln.pln_wip_pending pwp)
    ''')
    cur.execute(query6)
    conn.commit()

if len(df1) > 0:
    # Prepare the INSERT statement
    table_name = "pln.pln_wip_pending_details"
    columns = ", ".join(df1.columns)
    
    insert_query = f'''
        INSERT INTO {table_name} ({columns})
        VALUES %s
        ON CONFLICT (prd_name , lot , factory , unit , process) 
        DO UPDATE
        SET pending_reason = EXCLUDED.pending_reason,
            qty_pending = EXCLUDED.qty_pending,
            update_datetime = EXCLUDED.update_datetime
    '''

    # Convert DataFrame rows to a list of tuples
    data_values1 = [tuple(row) for row in df1.to_numpy()]

    # Execute the INSERT statement using execute_values for faster insertion
    conn, to_db = connect_to_psql_112()
    cur = conn.cursor()
    execute_values(cur, insert_query, data_values1)

    # Commit the changes to the database
    conn.commit()

    query7 = ('''
    delete from pln.pln_wip_pending_details pwpd
    where pwpd.update_datetime != (select max(pwpd.update_datetime)  
    from pln.pln_wip_pending_details pwpd)
    ''')
    cur.execute(query7)
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

print('Finished Export_data_po_wip_fg:{} minutes {} seconds'.format(int(minutes), int(seconds)),
      'Start_time:',format_start_time,
      'Stop_time:',format_stop_time)
print('Export_data_po_wip_fg %CPU(START/MID/END):',cpu_percent_start,'/',cpu_percent_middle,'/',cpu_percent_end,
      '%MEMORY(START/MID/END):',memory_percent_start,'/',memory_percent_middle,'/',memory_percent_end)