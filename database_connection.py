import psycopg2
import cx_Oracle
import os
import pandas as pd
from psycopg2.extras import execute_values

def con_oracle():
    try:
        #Oracle database connection
        os.environ['PATH'] = 'C:\\Program Files\\Oracle\\instantclient_19_8'
        dsn_tns = cx_Oracle.makedsn(r'fetldb1', r'1524', service_name=r'PCTTLIV_SV')
        conn = cx_Oracle.connect(
            user=r'fpc', 
            password=r'fpc',
            dsn=dsn_tns)
        print("connected database oracle")
        return conn, "Oracle"
    except cx_Oracle.Error as error:
        print(error)
        return str(error)

def connect_to_psql_localhost():
    try:
        #PostgreSQL database connection
        conn = psycopg2.connect(
            host="localhost", 
            user="postgres",
            password="12345",
            database="db_smart_plan"
        )
        print("connected database psql localhost")
        return conn, "localhost"
    except psycopg2.Error as error:
        print(error)
        return False, str(error)

def connect_to_psql_57():
    try:
        #PostgreSQL database connection
        conn = psycopg2.connect(
            host="10.17.71.57",
            user="postgres",
            password="fujikura",
            database="smart_factory"
        )
        print("connected database psql 57")
        return conn, "10.17.71.57"
    except psycopg2.Error as error:
        print(error)
        return False, str(error)

def connect_to_psql_21_data_log():
    try:
        #PostgreSQL database connection
        conn = psycopg2.connect(
            host='10.7.71.21', 
            user='postgres', 
            password='postgres', 
            database='data_log'
        )
        print("connected database psql 21")
        return conn, '10.7.71.21'
    except psycopg2.Error as error:
        print(error)
        return str(error)
    
def connect_to_psql_228_foxsystem():
    try:
        #PostgreSQL database connection
        conn = psycopg2.connect(
            host="10.17.66.228",
            user="postgres",
            password="postgres",
            database="foxsystem"
        )
        print("connected database psql 228")
        return conn, "10.17.66.228"
    except psycopg2.Error as error:
        print(error)
        return False, str(error)
    
def connect_to_psql_111():
    try:
        #PostgreSQL database connection
        conn = psycopg2.connect(
            host="10.17.77.111",
            user="postgres",
            password="postgres",
            database="postgres"
        )
        print("connected database psql 111")
        return conn, "10.17.77.111"
    except psycopg2.Error as error:
        print(error)
        return False, str(error)

def connect_to_psql_230():
    try:
        #PostgreSQL database connection
        conn = psycopg2.connect(
            host="10.17.66.230",
            user="postgres",
            password="postgres",
            database="postgres"
        )
        print("connected database psql 230")
        return conn, "10.17.66.230"
    except psycopg2.Error as error:
        print(error)
        return False, str(error)
    
def connect_to_psql_112():
    try:
        #PostgreSQL database connection
        conn = psycopg2.connect(
            host="10.17.66.112", 
            user="postgres",
            password="systemfetl",
            database="postgres_smartfactory"
        )
        print("connected database psql 112")
        return conn, "112"
    except psycopg2.Error as error:
        print(error)
        return False, str(error)    

def task_operation_record(task, data_detail,from_db, to_db,start_time, stop_time, op_time ):
    print("save task operation")
    # print(task,data_detail, from_db, to_db,start_time, stop_time, op_time)
    add_row = [task, data_detail,from_db, to_db,start_time, stop_time, op_time]
    #Create DataFrame
    df = [('task_description','data_details','from_database','to_database','start_datetime','stop_datetime','operation_time')]
    df.append(add_row)
    df = pd.DataFrame(df[1:],columns=df[0])

    if len(df) > 0:
        # Prepare the INSERT statement
        table_name = "smart_status_data_script_transform"
        columns = ", ".join(df.columns)
        
        # insert_query = f"INSERT INTO {table_name} ({columns}) VALUES %s ON CONFLICT DO NOTHING"
        insert_query = f'''
        INSERT INTO {table_name} ({columns})
        VALUES %s
        ON CONFLICT (task_description)
        DO UPDATE
        SET from_database = EXCLUDED.from_database,
            to_database = EXCLUDED.to_database,
            start_datetime = EXCLUDED.start_datetime,
            stop_datetime = EXCLUDED.stop_datetime,
            operation_time = EXCLUDED.operation_time,
            data_details = EXCLUDED.data_details
        '''
        # Convert DataFrame rows to a list of tuples
        data_values = [tuple(row) for row in df.to_numpy()]

        # Execute the INSERT statement using execute_values for faster insertion
        conn, from_db = connect_to_psql_111()
        cur = conn.cursor()
        execute_values(cur, insert_query, data_values)

        # Commit the changes to the database
        conn.commit()

    # Close the cursor and connection
    del df
    cur.close()
    conn.close()