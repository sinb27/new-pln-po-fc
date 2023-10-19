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
    SELECT
    FDAY.PFD_PERIOD_NO,
    'WK' || SUBSTR(TO_CHAR(FDAY.PFD_FORECAST_DATE,'YYYY'), 3, 2) || TO_CHAR(TO_DATE(FDAY.PFD_FORECAST_DATE, 'DD/MM/YYYY'), 'WW') AS WK,
    HED.PFH_PRD_NAME AS prd_name,
    SUBSTR(HED.PFH_PRD_NAME, 1, 3) AS prd_series, -- Extract the first 3 characters from prd_name
    SUM(FDAY.PFD_FORECAST_QTY) AS QTY_FC
FROM
    PCAP.PCAP_FORECAST_SALES_HEADER HED
INNER JOIN
    PCAP.PCAP_FORECAST_SALES_DETAIL_DAY FDAY
    ON HED.PFH_PERIOD_NO = FDAY.PFD_PERIOD_NO
    AND HED.PFH_FORECAST_TYPE = FDAY.PFD_FORECAST_TYPE
    AND HED.PFH_FORECAST_NO = FDAY.PFD_FORECAST_NO
INNER JOIN
    (
        SELECT DISTINCT
            HED.PFH_PRD_NAME,
            HED.PFH_PERIOD_NO,
            HED.PFH_FORECAST_TYPE,
            HED.PFH_FORECAST_NO
        FROM
            PCAP.PCAP_FORECAST_SALES_HEADER HED,
            PCAP.PCAP_FORECAST_MONTH_DETAIL DETM
        WHERE
            HED.PFH_PERIOD_NO = DETM.PFM_PERIOD_NO
            AND HED.PFH_FORECAST_TYPE = DETM.PFM_FORECAST_TYPE
            AND HED.PFH_FORECAST_NO = DETM.PFM_FORECAST_NO
            AND HED.PFH_PERIOD_NO = (
                SELECT P.PPW_PERIOD_NO
                FROM pcap.pcap_period_week P
                WHERE P.PPW_PERIOD_STATUS = 'A'
            )
            AND HED.PFH_FORECAST_TYPE = '000015'
        ORDER BY HED.PFH_FORECAST_NO
    ) CUTSEMI
    ON HED.PFH_PRD_NAME = CUTSEMI.PFH_PRD_NAME
    AND HED.PFH_PERIOD_NO = CUTSEMI.PFH_PERIOD_NO
    AND HED.PFH_FORECAST_TYPE = CUTSEMI.PFH_FORECAST_TYPE
    AND HED.PFH_FORECAST_NO = CUTSEMI.PFH_FORECAST_NO
WHERE
    FDAY.PFD_FORECAST_TYPE = '000015'
    AND FDAY.PFD_FORECAST_QTY > 0
GROUP BY
    FDAY.PFD_PERIOD_NO,
    'WK' || SUBSTR(TO_CHAR(FDAY.PFD_FORECAST_DATE,'YYYY'), 3, 2) || TO_CHAR(TO_DATE(FDAY.PFD_FORECAST_DATE, 'DD/MM/YYYY'), 'WW'),
    SUBSTR(HED.PFH_PRD_NAME, 1, 3),
    HED.PFH_PRD_NAME
''')
# query4 = ('''
#     SELECT FDAY.PFD_PERIOD_NO
#        --,TO_CHAR(FDAY.PFD_FORECAST_DATE,'YYYY-MM') AS FC_MONTH
#        ,'WK'||SUBSTR(TO_CHAR(FDAY.PFD_FORECAST_DATE,'YYYY'),3,2)||(TO_CHAR(TO_DATE(FDAY.PFD_FORECAST_DATE,'DD/MM/YYYY'),'WW')) AS  WK
#        --,FDAY.PFD_FORECAST_DATE AS FC_DATE
#        ,HED.PFH_PRD_NAME AS prd_name
#        --,HED.PFH_PRD_ITEM_CODE
#        --,HED.PFH_RO_REV
#        ,SUM(FDAY.PFD_FORECAST_QTY) AS QTY_FC
#        --,0 AS QTY_FG
#        --,0 AS QTY_WIP
#        --,0 AS QTY_REC
#        --,0 AS QTY_DUE
#        --,0 AS QTY_BAL
# FROM PCAP.PCAP_FORECAST_SALES_HEADER HED
# INNER JOIN PCAP.PCAP_FORECAST_SALES_DETAIL_DAY FDAY ON HED.PFH_PERIOD_NO = FDAY.PFD_PERIOD_NO
#                                                          AND HED.PFH_FORECAST_TYPE = FDAY.PFD_FORECAST_TYPE
#                                                          AND HED.PFH_FORECAST_NO = FDAY.PFD_FORECAST_NO
# INNER JOIN (SELECT DISTINCT 
#                HED.PFH_PRD_NAME
#                ,HED.PFH_PERIOD_NO
#                ,HED.PFH_FORECAST_TYPE
#                ,HED.PFH_FORECAST_NO 
#         FROM PCAP.PCAP_FORECAST_SALES_HEADER HED
#              ,PCAP.PCAP_FORECAST_MONTH_DETAIL DETM
#         WHERE HED.PFH_PERIOD_NO = DETM.PFM_PERIOD_NO
#               AND HED.PFH_FORECAST_TYPE = DETM.PFM_FORECAST_TYPE
#               AND HED.PFH_FORECAST_NO = DETM.PFM_FORECAST_NO
#               AND HED.PFH_PERIOD_NO = (Select P.PPW_PERIOD_NO
# FROM pcap.pcap_period_week P
# WHERE P.PPW_PERIOD_STATUS = 'A')
#               AND HED.PFH_FORECAST_TYPE = '000015' -- FC Exfactory
# ORDER BY HED.PFH_FORECAST_NO ) CUTSEMI ON HED.PFH_PRD_NAME = CUTSEMI.PFH_PRD_NAME
#       AND HED.PFH_PERIOD_NO = CUTSEMI.PFH_PERIOD_NO
#       AND HED.PFH_FORECAST_TYPE = CUTSEMI.PFH_FORECAST_TYPE
#       AND HED.PFH_FORECAST_NO = CUTSEMI.PFH_FORECAST_NO
# WHERE FDAY.PFD_FORECAST_TYPE =  '000015' -- FC Exfactory
#       AND FDAY.PFD_FORECAST_QTY > 0
# GROUP BY FDAY.PFD_PERIOD_NO
#        --,TO_CHAR(FDAY.PFD_FORECAST_DATE,'YYYY-MM')
#        ,'WK'||SUBSTR(TO_CHAR(FDAY.PFD_FORECAST_DATE,'YYYY'),3,2)||(TO_CHAR(TO_DATE(FDAY.PFD_FORECAST_DATE,'DD/MM/YYYY'),'WW'))
#        --,FDAY.PFD_FORECAST_DATE
#        ,HED.PFH_PRD_NAME
#        --,HED.PFH_PRD_ITEM_CODE;
#        --,HED.PFH_RO_REV
# ''')

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
    table_name = "pln.pln_fc"
    columns = ", ".join(df.columns)
    
    insert_query = f'''
        INSERT INTO {table_name} ({columns})
        VALUES %s
        ON CONFLICT (pfd_period_no , wk , prd_name)
        DO UPDATE
        SET qty_fc = EXCLUDED.qty_fc,
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

    # query6 = ('''
    # delete from pln_fc pf
    # where pf.update_datetime != (select max(pf.update_datetime)  
    # from pln_fc pf)
    # ''')
    # cur.execute(query6)
    # conn.commit()

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