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
    SELECT 'WK'||SUBSTR(TO_CHAR(g.IH_SHIP_DATE,'YYYY'),3,2)||(TO_CHAR(TO_DATE(g.IH_SHIP_DATE,'DD/MM/YYYY'),'WW')) AS  WK 
       ,h.prd_name
       ,SUBSTR(h.prd_name,1,3) AS PRD_SERIES
       ,SUM(f.IDH_QTY_SHIP) AS QTY_SHIP
    FROM QAD.IDH_HIST@PCTTPROD f
    INNER JOIN QAD.IH_HIST@PCTTPROD g ON f.IDH_NBR = g.IH_NBR
                                    AND f.IDH_INV_NBR = g.IH_INV_NBR
    INNER JOIN fpc.fpc_product h ON f.IDH_PART = h.prd_item_code
    INNER JOIN (SELECT f.IDH_NBR, max(PROGRESS_RECID) AS PROGRESS_RECID
            FROM QAD.IDH_HIST@PCTTPROD f
            GROUP BY f.IDH_NBR) j ON f.IDH_NBR = j.IDH_NBR
                                    AND f.PROGRESS_RECID=j.PROGRESS_RECID
    WHERE SUBSTR(F.IDH_NBR,0,2) in ('2S','2F')
    --AND f.IDH_PART like '%RGOZ867ML2F'
    --AND f.idh_nbr= '2FB11331'
    AND f.IDH_QTY_SHIP > 0
    AND TO_CHAR(g.IH_SHIP_DATE,'YYYYMMDD') >= '20230101'
    AND SUBSTR(TO_CHAR(g.IH_SHIP_DATE ,'YYYY'),3,2)||TO_CHAR(TO_DATE(g.IH_SHIP_DATE,'DD/MM/YYYY'),'WW') >= SUBSTR(TO_CHAR(SYSDATE ,'YYYY'),3,2)||TO_CHAR(TO_DATE(sysdate-84 ,'DD/MM/YYYY'),'WW')
    GROUP BY 'WK'||SUBSTR(TO_CHAR(g.IH_SHIP_DATE,'YYYY'),3,2)||(TO_CHAR(TO_DATE(g.IH_SHIP_DATE,'DD/MM/YYYY'),'WW'))
        ,h.prd_name
        ,SUBSTR(h.prd_name,1,3)
''')
c.execute(query4)
result = c.fetchall()
col_names = [desc[0] for desc in c.description]  # columns name PostgreSQL
df = pd.DataFrame(result, columns=col_names)

query5 = ('''
    SELECT f.IDH_NBR AS SO_NO
       ,f.IDH_LINE AS LINE_NO
       ,f.IDH_CUSTPART AS CUST_PART
       ,f.IDH_INV_NBR AS INV_NBR
       ,g.IH_ORD_DATE AS ORD_DATE
       ,f.IDH_DUE_DATE AS DUE_DATE
       ,g.IH_SHIP_DATE AS SHIP_DATE
       ,h.prd_name
       ,SUBSTR(h.prd_name,1,3) AS PRD_SERIES
       ,SUM(f.IDH_QTY_SHIP) QTY_SHIP
       ,CASE WHEN j.PROGRESS_RECID IS NULL THEN 'N' ELSE 'Y' END AS INV_STATUS --check status
       --,'id-' || j.PROGRESS_RECID AS PROG_ID
        ,CASE WHEN j.PROGRESS_RECID IS NULL THEN f.PROGRESS_RECID ELSE j.PROGRESS_RECID END AS PROG_ID --check status
        FROM QAD.IDH_HIST@PCTTPROD f
        INNER JOIN QAD.IH_HIST@PCTTPROD g ON f.IDH_NBR = g.IH_NBR
                                        AND f.IDH_INV_NBR = g.IH_INV_NBR
        INNER JOIN fpc.fpc_product h ON f.IDH_PART = h.prd_item_code
        LEFT JOIN (SELECT f.IDH_NBR,SUBSTR(f.IDH_INV_NBR,1,7) AS IDH_INV_NBR, max(PROGRESS_RECID) AS PROGRESS_RECID
                FROM QAD.IDH_HIST@PCTTPROD f
                GROUP BY f.IDH_NBR, SUBSTR(f.IDH_INV_NBR,1,7)) j ON f.IDH_NBR = j.IDH_NBR
                                                AND f.PROGRESS_RECID = j.PROGRESS_RECID
        WHERE SUBSTR(F.IDH_NBR,0,2) in ('2S','2F')
        --AND f.IDH_PART like '%CAW076W0A'
        --AND f.idh_nbr= '2FC06563'
        AND TO_CHAR(g.IH_SHIP_DATE,'YYYYMMDD') >= '20230101'
        --AND SUBSTR(TO_CHAR(g.IH_SHIP_DATE ,'YYYY'),3,2)||TO_CHAR(TO_DATE(g.IH_SHIP_DATE,'DD/MM/YYYY'),'WW') >= SUBSTR(TO_CHAR(SYSDATE ,'YYYY'),3,2)||TO_CHAR(TO_DATE(sysdate-84 ,'DD/MM/YYYY'),'WW')
        GROUP BY f.IDH_NBR
                ,f.IDH_LINE
            ,f.IDH_CUSTPART
            ,f.IDH_INV_NBR
            ,g.IH_ORD_DATE
            ,f.IDH_DUE_DATE
            ,g.IH_SHIP_DATE
            ,h.prd_name
            ,SUBSTR(h.prd_name,1,3)
            ,CASE WHEN j.PROGRESS_RECID IS NULL THEN 'N' ELSE 'Y' END
            ,CASE WHEN j.PROGRESS_RECID IS NULL THEN f.PROGRESS_RECID ELSE j.PROGRESS_RECID END
        ORDER BY
            f.IDH_NBR
            ,f.IDH_INV_NBR
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
    table_name = "pln.pln_actual_ship_summary"
    columns = ", ".join(df.columns)
    
    insert_query = f'''
        INSERT INTO {table_name} ({columns})
        VALUES %s
        ON CONFLICT (wk , prd_name)
        DO UPDATE
        SET qty_ship = EXCLUDED.qty_ship,
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
    delete from pln.pln_actual_ship_summary pass
    where pass.update_datetime != (select max(pass.update_datetime)  
    from pln.pln_actual_ship_summary pass)
    ''')
    cur.execute(query6)
    conn.commit()

if len(df1) > 0:
    # Prepare the INSERT statement
    table_name = "pln.pln_actual_ship_detail"
    columns = ", ".join(df1.columns)
    
    insert_query = f'''
        INSERT INTO {table_name} ({columns})
        VALUES %s
        ON CONFLICT (so_no , inv_nbr , prd_name , inv_status ,  prog_id) 
        DO UPDATE
        SET ord_date = EXCLUDED.ord_date,
            due_date = EXCLUDED.due_date,
            ship_date = EXCLUDED.ship_date,
            qty_ship = EXCLUDED.qty_ship,
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
    delete from pln.pln_actual_ship_detail pasd
    where pasd.update_datetime != (select max(pasd.update_datetime)  
    from pln.pln_actual_ship_detail pasd)
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

print('Finished Export_data_forecast_week:{} minutes {} seconds'.format(int(minutes), int(seconds)),
      'Start_time:',format_start_time,
      'Stop_time:',format_stop_time)
print('Export_data_forecast_week %CPU(START/MID/END):',cpu_percent_start,'/',cpu_percent_middle,'/',cpu_percent_end,
      '%MEMORY(START/MID/END):',memory_percent_start,'/',memory_percent_middle,'/',memory_percent_end)