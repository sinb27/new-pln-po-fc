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
    SELECT POWIP.WK
       ,POWIP.PRD_NAME
       ,POWIP.PD_SERIES
       ,SUM(POWIP.QTY_FG) AS QTY_FG
       ,SUM(POWIP.QTY_WIP) AS QTY_WIP
       ,SUM(POWIP.QTY_REC) AS QTY_REC
       ,SUM(POWIP.QTY_DUE) AS QTY_DUE
       ,SUM(POWIP.QTY_BAL) AS QTY_BAL
    FROM (SELECT 'WK'||SUBSTR(TO_CHAR(s.order_date ,'YYYY'),3,2)||(TO_CHAR(TO_DATE(s.order_date ,'DD/MM/YYYY'),'WW')) AS  WK
             ,p.prd_name
             ,SUBSTR(p.prd_name,1,3) AS PD_SERIES
             ,0 AS QTY_FG
             ,0 AS QTY_WIP
             ,SUM(d.order_qty) AS QTY_REC
             ,0 AS QTY_DUE
             ,0 AS QTY_BAL
      FROM PLAN.SO_DETAIL d
           INNER JOIN FPC.FPC_PRODUCT p ON d.item_code = p.prd_item_code
           LEFT JOIN PLAN.SO_PLAN s ON d.so_no = s.so_no
      WHERE SUBSTR(d.So_No,0,2) in ('2S','2F')
      AND TO_CHAR(d.due_date ,'YYYYMMDD') >= '20230101'
      AND SUBSTR(TO_CHAR(s.order_date ,'YYYY'),3,2)||TO_CHAR(TO_DATE(s.order_date ,'DD/MM/YYYY'),'WW') >= SUBSTR(TO_CHAR(SYSDATE ,'YYYY'),3,2)||TO_CHAR(TO_DATE(sysdate-84 ,'DD/MM/YYYY'),'WW')
      AND TO_CHAR(d.due_date ,'YYYYMMDD') not in ('20300101','20300202','20400101','20400202','20500101','20500202')--CUT PO Hold, update only due date
      AND d.So_Delete_Flag = 0
      AND d.order_qty >= 0
      GROUP BY 
             'WK'||SUBSTR(TO_CHAR(s.order_date ,'YYYY'),3,2)||(TO_CHAR(TO_DATE(s.order_date ,'DD/MM/YYYY'),'WW'))
             ,p.prd_name
             ,SUBSTR(p.prd_name,1,3)
      UNION --POREC&PODUE
      SELECT 'WK'||SUBSTR(TO_CHAR(d.due_date ,'YYYY'),3,2)||(TO_CHAR(TO_DATE(d.due_date ,'DD/MM/YYYY'),'WW')) AS  WK
             ,p.prd_name
             ,SUBSTR(p.prd_name,1,3) AS PD_SERIES
             ,0 AS QTY_FG
             ,0 AS QTY_WIP
             ,0 AS QTY_REC
             ,SUM(d.order_qty) QTY_DUE
             ,0 AS QTY_BAL
      FROM PLAN.SO_DETAIL d
           INNER JOIN FPC.FPC_PRODUCT p ON d.item_code = p.prd_item_code
      WHERE SUBSTR(d.So_No,0,2) in ('2S','2F')
      --AND TO_CHAR(d.due_date ,'YYYYMMDD') >= '20230101'
      AND SUBSTR(TO_CHAR(d.due_date ,'YYYY'),3,2)||TO_CHAR(TO_DATE(d.due_date ,'DD/MM/YYYY'),'WW') >= SUBSTR(TO_CHAR(SYSDATE ,'YYYY'),3,2)||TO_CHAR(TO_DATE(sysdate-84 ,'DD/MM/YYYY'),'WW')
      AND TO_CHAR(d.due_date ,'YYYYMMDD') not in ('20300101','20300202','20400101','20400202','20500101','20500202')--CUT PO Hold, update only due date
      AND d.So_Delete_Flag = 0
      AND d.order_qty >= 0
      GROUP BY 'WK'||SUBSTR(TO_CHAR(d.due_date ,'YYYY'),3,2)||(TO_CHAR(TO_DATE(d.due_date ,'DD/MM/YYYY'),'WW'))
               ,p.prd_name
               ,SUBSTR(p.prd_name,1,3)
      UNION --POBAL
     SELECT 'WK'||SUBSTR(TO_CHAR(d.due_date ,'YYYY'),3,2)||TO_CHAR(d.due_date,'WW') AS  WK
             ,p.prd_name
             ,SUBSTR(p.prd_name,1,3) AS PD_SERIES
             ,0 AS QTY_FG
             ,0 AS QTY_WIP
             ,0 AS QTY_REC
             ,0 AS QTY_DUE
             ,SUM(CASE WHEN d.ship_status = 0 THEN d.order_qty ELSE 0 END) QTY_BAL
      FROM PLAN.SO_DETAIL d
           INNER JOIN FPC.FPC_PRODUCT p ON d.item_code = p.prd_item_code
      WHERE SUBSTR(d.So_No,0,2) in ('2S','2F')
      AND TO_CHAR(d.due_date ,'YYYYMMDD') >= '20230101'
      AND SUBSTR(TO_CHAR(d.due_date ,'YYYY'),3,2)||TO_CHAR(TO_DATE(d.due_date ,'DD/MM/YYYY'),'WW') >= SUBSTR(TO_CHAR(SYSDATE ,'YYYY'),3,2)||TO_CHAR(TO_DATE(sysdate-84 ,'DD/MM/YYYY'),'WW')
      AND TO_CHAR(d.due_date ,'YYYYMMDD') not in ('20300101','20300202','20400101','20400202','20500101','20500202')--CUT PO Hold, update only due date
      AND d.So_Delete_Flag = 0
      AND d.order_qty >= 0
      GROUP BY 'WK'||SUBSTR(TO_CHAR(d.due_date ,'YYYY'),3,2)||TO_CHAR(d.due_date,'WW') 
               ,p.prd_name
               ,SUBSTR(p.prd_name,1,3)
     UNION --FG
     SELECT 'WK'||SUBSTR(TO_CHAR(SYSDATE,'YYYY'),3,2)||(TO_CHAR(TO_DATE(SYSDATE,'DD/MM/YYYY'),'WW')) AS  WK
           ,p.prd_name
           ,SUBSTR(p.prd_name,1,3) AS PD_SERIES
           ,SUM(f.LD_QTY_OH) AS QTY_FG
           ,0 AS QTY_WIP
           ,0 AS QTY_REC
           ,0 AS QTY_DUE
           ,0 AS QTY_BAL
    FROM plan.s_qad_ld_det f
         INNER JOIN fpc.fpc_product p on f.LD_PART = p.prd_item_code
    WHERE f.LD_STATUS = 'GOOD'
    AND f.LD_DOMAIN = '2000'
    AND f.LD_SITE = '2100'
    GROUP BY 'WK'||SUBSTR(TO_CHAR(SYSDATE,'YYYY'),3,2)||(TO_CHAR(TO_DATE(SYSDATE,'DD/MM/YYYY'),'WW'))
           ,p.prd_name
           ,SUBSTR(p.prd_name,1,3)
    UNION --WIP
    SELECT 'WK'||SUBSTR(TO_CHAR(SYSDATE,'YYYY'),3,2)||(TO_CHAR(TO_DATE(SYSDATE,'DD/MM/YYYY'),'WW')) AS  WK
           ,W.PRD_NAME
           ,SUBSTR(W.PRD_NAME,1,3) AS PD_SERIES
           ,0 AS QTY_FG
           ,SUM(INPUT_QTY) AS QTY_WIP
           ,0 AS QTY_REC
           ,0 AS QTY_DUE
           ,0 AS QTY_BAL
    FROM
      (SELECT
        L.LOT_PRD_NAME AS PRD_NAME,
        L.WO_FG_QTY - NVL((SELECT SUM(R.REJH_QTY + R.REJH_QTY_SCRAP)
                                  FROM FPC_REJECT_HEADER R
                                  WHERE L.LOT_PRD_NAME = R.REJH_PRD_NAME
                                        AND L.LOT = R.REJH_LOTNO
                                  ) , 0) AS INPUT_QTY 
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
        L.LOT_SCAN_FINISH IN ('N', 'P')
        AND (L.SCAN_CODE <> '00'
        OR (L.SCAN_CODE = '00'
        AND L.LOT_SCH_EFFDAT < SYSDATE))) W
    GROUP BY W.PRD_NAME,SUBSTR(W.PRD_NAME,1,3)
       )POWIP
GROUP BY POWIP.WK
       ,POWIP.PRD_NAME
       ,POWIP.PD_SERIES
''')
c.execute(query4)
result = c.fetchall()
col_names = [desc[0] for desc in c.description]  # columns name PostgreSQL
df = pd.DataFrame(result, columns=col_names)
# filtered_df_general = df[(df['PD_SERIES'] != 'RGO') & (df['PD_SERIES'] != 'RGP')]
# filtered_df_rgo = df[df['PD_SERIES'] == 'RGO']
# filtered_df_rgp = df[df['PD_SERIES'] == 'RGP']

# filtered_df_general.to_csv('filtered_df_general.csv', index=False)
# filtered_df_rgo.to_csv('filtered_df_rgo.csv', index=False)
# filtered_df_rgp.to_csv('filtered_df_rgp.csv', index=False)

query5 = ('''
    SELECT d.so_no
       ,d.so_line
       ,d.request_date
       ,d.due_date
       ,p.prd_name
       ,SUBSTR(p.prd_name, 1, 3) AS prd_series
       ,CASE WHEN d.ship_status = 0 THEN d.order_qty ELSE 0 END QTY_BAL
      FROM PLAN.SO_DETAIL d
           INNER JOIN FPC.FPC_PRODUCT p ON d.item_code = p.prd_item_code
      WHERE SUBSTR(d.So_No,0,2) in ('2S','2F')
      --AND p.prd_name = 'CAK-214W-0A'
      AND TO_CHAR(d.due_date ,'YYYYMMDD') >= '20230101'
      AND CASE WHEN d.ship_status = 0 THEN d.order_qty ELSE 0 END >0
      --AND SUBSTR(TO_CHAR(d.due_date ,'YYYY'),3,2)||TO_CHAR(TO_DATE(d.due_date ,'DD/MM/YYYY'),'WW') >= SUBSTR(TO_CHAR(SYSDATE ,'YYYY'),3,2)||TO_CHAR(TO_DATE(sysdate-84 ,'DD/MM/YYYY'),'WW')
      AND TO_CHAR(d.due_date ,'YYYYMMDD') not in ('20300101','20300202','20400101','20400202','20500101','20500202')--CUT PO Hold, update only due date
      AND d.So_Delete_Flag = 0
      AND d.order_qty >= 0
ORDER BY d.so_no
       ,d.so_line
       ,p.prd_name
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
    table_name = "pln.pln_po_wip_fg"
    columns = ", ".join(df.columns)
    
    insert_query = f'''
        INSERT INTO {table_name} ({columns})
        VALUES %s
        ON CONFLICT (wk , prd_name , pd_series) 
        DO UPDATE
        SET qty_fg = EXCLUDED.qty_fg,
            qty_wip = EXCLUDED.qty_wip,
            qty_rec = EXCLUDED.qty_rec,
            qty_due = EXCLUDED.qty_due,
            qty_bal = EXCLUDED.qty_bal,
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
    delete from pln.pln_po_wip_fg ppwf
    where ppwf.update_datetime != (select max(ppwf.update_datetime)  
    from pln.pln_po_wip_fg ppwf)
    ''')
    cur.execute(query6)
    conn.commit()

if len(df1) > 0:
    # Prepare the INSERT statement
    table_name = "pln.pln_pobal_detail"
    columns = ", ".join(df1.columns)
    
    insert_query = f'''
        INSERT INTO {table_name} ({columns})
        VALUES %s
        ON CONFLICT (so_no , so_line , prd_name) 
        DO UPDATE
        SET request_date = EXCLUDED.request_date,
            due_date = EXCLUDED.due_date,
            qty_bal = EXCLUDED.qty_bal,
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
    delete from pln.pln_pobal_detail ppd
    where ppd.update_datetime != (select max(ppd.update_datetime)  
    from pln.pln_pobal_detail ppd)
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