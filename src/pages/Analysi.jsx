import React, { useState, useEffect } from "react";

// import * as React from 'react';

import Box from "@mui/material/Box";

import { DataGrid, GridToolbar } from "@mui/x-data-grid";

import { randomTraderName, randomEmail } from "@mui/x-data-grid-generator";

import FormControlLabel from "@mui/material/FormControlLabel";

import Switch from "@mui/material/Switch";

import "./Planning_Forecast_AnalysisPage.css"; // Import the CSS file

import CircularProgress from "@mui/material/CircularProgress";

import axios from "axios";

const columns = [
  {
    field: "sales",

    headerName: "Sales",

    width: 150,

    headerAlign: "center",

    headerClassName: "bold-header",
  },

  {
    field: "part",

    headerName: "Part",

    width: 200,

    headerAlign: "center",

    headerClassName: "bold-header",
  },

  {
    field: "ship_factory",

    headerName: "Ship Factory",

    width: 100,

    headerAlign: "center",

    align: "center",

    headerClassName: "bold-header",
  },

  {
    field: "planner",

    headerName: "Planner",

    width: 120,

    headerAlign: "center",

    headerClassName: "bold-header",
  },

  {
    field: "fc",

    headerName: "FC",

    width: 100,

    headerAlign: "center",

    align: "center",

    headerClassName: "bold-header",
  },

  {
    field: "po_cover_fc",

    headerName: "PO-Cover-FC (WK)",

    width: 150,

    headerAlign: "center",

    align: "center",

    headerClassName: "bold-header",
  },

  {
    field: "fc_accuracy",

    headerName: "FC_Accuracy (4WK)",

    width: 150,

    headerAlign: "center",

    align: "center",

    headerClassName: "bold-header",
  },

  {
    field: "wip",

    headerName: "WIP",

    width: 100,

    headerAlign: "center",

    align: "center",

    headerClassName: "bold-header",
  },

  {
    field: "fg",

    headerName: "FG",

    width: 100,

    headerAlign: "center",

    align: "center",

    headerClassName: "bold-header",
  },

  {
    field: "po_bal",

    headerName: "PO_BAL",

    width: 100,

    headerAlign: "center",

    align: "center",

    headerClassName: "bold-header",
  },

  {
    field: "wip_fg_compare_po",

    headerName: "WIP+FG compare PO",

    width: 130,

    headerAlign: "center",

    align: "center",

    headerClassName: "bold-header",
  },

  {
    field: "wip_fg_compare_fc",

    headerName: "WIP+FG compare FC",

    width: 130,

    headerAlign: "center",

    align: "center",

    headerClassName: "bold-header",
  },
];

// const rows = [

//   { id:1 , sales: 'FAM', part: 'CACZ-136MW-2DL1' , ship_factory: 'P1' , planner: 'PANASSAYA' , fc: 100 ,

//     po_cover_fc: 3.5 , fc_accuracy: '80 %' , wip: 30 , fg: 50 , po_bal: 120 ,

//     wip_fg_compare_po: "100 %" , wip_fg_compare_fc: '50 %' },

//   { id:2 ,sales: 'FAM', part: 'CAC-161S-1C' , ship_factory: 'A1' , planner: 'PANASSAYA' , fc: 200 ,

//   po_cover_fc: 3.5 , fc_accuracy: '80 %' , wip: 230 , fg: 50 , po_bal: 120 ,

//   wip_fg_compare_po: "20 %" , wip_fg_compare_fc: '30 %' },

// ];

export default function Planning_Forecast_AnalysisPage({ onSearch }) {
  const [filterModel, setFilterModel] = React.useState({
    items: [],

    quickFilterExcludeHiddenColumns: true,

    quickFilterValues: [""],
  });

  function formatNumberWithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  const [distinctFcAnalysis, setDistinctFcAnalysis] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  const fetchFcAnalysis = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        "http://10.17.66.242:3001/api/smart_planning/filter-fc-analysis"
      );
      const data = response.data;
      // Add a unique id property to each row
      const rowsWithId = data.map((row, index) => ({
        ...row,
        id: index, // You can use a better unique identifier here if available
      }));
      setDistinctFcAnalysis(rowsWithId);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("An error occurred while fetching data Wip Details");
    } finally {
      setIsLoading(false); // Set isLoading back to false when fetch is complete
    }
  };

  useEffect(() => {
    fetchFcAnalysis();
  }, []);

  const [columnVisibilityModel, setColumnVisibilityModel] = React.useState({});

  return (
    <>
      <div
        className="table-responsive table-fullscreen"
        style={{ height: 800, width: "1550px", marginTop: "5px" }}
      >
        {isLoading ? ( // Render the loading indicator if isLoading is true
          <div
            className="loading-indicator"
            style={{
              display: "flex",

              flexDirection: "column",

              justifyContent: "center",

              alignItems: "center",

              height: "50vh",
            }}
          >
            <CircularProgress />{" "}
            {/* Use the appropriate CircularProgress component */}
            <p>Loading data...</p>
            {/* <p>Loading data...{Math.round(loadingPercentage)}%</p> */}
          </div>
        ) : (
          <Box sx={{ width: 1 }}>
            {/* <FormControlLabel

            checked={columnVisibilityModel.id !== false}

            onChange={(event) =>

              setColumnVisibilityModel(() => ({ id: event.target.checked }))

            }

            control={<Switch color="primary" size="small" />}

            label="Show ID column"

          />

          <FormControlLabel

            checked={filterModel.quickFilterExcludeHiddenColumns}

            onChange={(event) =>

              setFilterModel((model) => ({

                ...model,

                quickFilterExcludeHiddenColumns: event.target.checked,

              }))

            }

            control={<Switch color="primary" size="small" />}

            label="Exclude hidden columns"

          /> */}

            <Box sx={{ height: 725 }}>
              <DataGrid
                columns={columns}
                rows={distinctFcAnalysis.map((row) => ({
                  ...row,

                  fc: formatNumberWithCommas(row.fc),

                  wip: formatNumberWithCommas(row.wip),

                  fg: formatNumberWithCommas(row.fg),

                  po_bal: formatNumberWithCommas(row.po_bal),
                }))}
                disableColumnFilter
                disableDensitySelector
                slots={{ toolbar: GridToolbar }}
                filterModel={filterModel}
                onFilterModelChange={(newModel) => setFilterModel(newModel)}
                slotProps={{ toolbar: { showQuickFilter: true } }}
                columnVisibilityModel={columnVisibilityModel}
                onColumnVisibilityModelChange={(newModel) =>
                  setColumnVisibilityModel(newModel)
                }
              />
            </Box>
          </Box>
        )}
      </div>
    </>
  );
}
