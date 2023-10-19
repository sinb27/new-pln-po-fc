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
    SELECT 'WK'||SUBSTR(TO_CHAR(CURRENT_DATE,'YYYY'),3,2)||(TO_CHAR(TO_DATE(CURRENT_DATE,'DD/MM/YYYY'),'WW')) AS  WK
       ,p.prd_name
       ,SUBSTR(p.prd_name,1,3) AS PRD_SERIES
       ,f.LD_LOC
       ,f.LD_STATUS
       ,SUM(f.LD_QTY_OH) AS QTY_GOOD
    FROM plan.s_qad_ld_det f
        INNER JOIN fpc.fpc_product p on f.LD_PART = p.prd_item_code
    WHERE f.LD_STATUS = 'GOOD'
    AND f.LD_DOMAIN = '2000'
    AND f.LD_SITE = '2100'
    --AND p.prd_name = 'ICIZ-043MS-2C'
    GROUP BY 'WK'||SUBSTR(TO_CHAR(CURRENT_DATE,'YYYY'),3,2)||(TO_CHAR(TO_DATE(CURRENT_DATE,'DD/MM/YYYY'),'WW'))
        ,p.prd_name
        ,SUBSTR(p.prd_name,1,3)
        ,f.LD_LOC
        ,f.LD_STATUS
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
    table_name = "pln.pln_fg_detail"
    columns = ", ".join(df.columns)
    
    insert_query = f'''
        INSERT INTO {table_name} ({columns})
        VALUES %s
        ON CONFLICT (wk , prd_name , ld_loc)
        DO UPDATE
        SET ld_status = EXCLUDED.ld_status,
            qty_good = EXCLUDED.qty_good,
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
    delete from pln.pln_fg_detail pfd
    where pfd.update_datetime != (select max(pfd.update_datetime)  
    from pln.pln_fg_detail pfd)
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