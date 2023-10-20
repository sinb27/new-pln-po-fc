// import { useDemoData } from "@mui/x-data-grid-generator";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExportContainer,
  GridCsvExportMenuItem,
  useGridApiContext,
  gridFilteredSortedRowIdsSelector,
  gridVisibleColumnFieldsSelector,
} from "@mui/x-data-grid";
import MenuItem from "@mui/material/MenuItem";
import { useState, useEffect } from "react";
// import { FaTrash } from "react-icons/fa";
// import AcUnitIcon from "@mui/icons-material/AcUnit";
import ConnectedTvTwoToneIcon from "@mui/icons-material/ConnectedTvTwoTone";
import LaptopTwoToneIcon from "@mui/icons-material/LaptopTwoTone";

const getJson = (apiRef) => {
  // Select rows and columns
  const filteredSortedRowIds = gridFilteredSortedRowIdsSelector(apiRef);
  const visibleColumnsField = gridVisibleColumnFieldsSelector(apiRef);

  // Format the data. Here we only keep the value
  const data = filteredSortedRowIds.map((id) => {
    const row = {};
    visibleColumnsField.forEach((field) => {
      row[field] = apiRef.current.getCellParams(id, field).value;
    });
    return row;
  });

  // Stringify with some indentation
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#parameters
  return JSON.stringify(data, null, 2);
};

const exportBlob = (blob, filename) => {
  // Save the blob in a json file
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  });
};

function JsonExportMenuItem(props) {
  const apiRef = useGridApiContext();

  const { hideMenu } = props;

  return (
    <MenuItem
      onClick={() => {
        const jsonString = getJson(apiRef);
        const blob = new Blob([jsonString], {
          type: "text/json",
        });
        exportBlob(blob, "DataGrid_demo.json");

        // Hide the export menu after the export
        hideMenu?.();
      }}
    >
      Export JSON
    </MenuItem>
  );
}

const csvOptions = { delimiter: "," };

function CustomExportButton(props) {
  return (
    <GridToolbarExportContainer {...props}>
      <GridCsvExportMenuItem options={csvOptions} />
      <JsonExportMenuItem />
    </GridToolbarExportContainer>
  );
}

function CustomToolbar(props) {
  return (
    <GridToolbarContainer {...props}>
      <CustomExportButton />
    </GridToolbarContainer>
  );
}

export default function DataGridPage() {
  const [error, setError] = useState(null);
  const [computers, setComputers] = useState([]);
  const [runningNumber, setRunningNumber] = useState(1);

  const fetchData = async (userUpdateBy = "Anupab.K") => {
    try {
      const response = await fetch(
        `http://localhost:3002/api/computer-list?user_update_by=${userUpdateBy}`
      );
      if (!response.ok) {
        throw new Error("Network response was not OK");
      }
      const data = await response.json();
      // Add running number to each data row

      const dataWithRunningNumber = data.map((item, index) => ({
        runningnumber: index + 1,
        ...item,
      }));

      setComputers(dataWithRunningNumber);
      setRunningNumber(1); // Reset the running number to 1
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("An error occurred while fetching data");
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  //   const { data, loading } = useDemoData({
  //     dataSet: 'Commodity',
  //     rowLength: 4,
  //     maxColumns: 6,
  //   });

  const columns = [
    {
      field: "runningnumber",
      headerName: "No",
      width: 50,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "computer_name",
      headerName: "Computer Name",
      width: 150,
      headerAlign: "center",
    },
    {
      field: "factory",
      headerName: "Factory",
      width: 150,
      headerAlign: "center",
      renderCell: (params) => (
        <div>
          {/* <AcUnitIcon name="factory" /> */}
          {params.value}&nbsp;&nbsp;&nbsp;&nbsp;
          {/* <AcUnitIcon name="factory" /> */}
        </div>
      ),
    },
    {
      field: "department",
      headerName: "Department",
      width: 150,
      headerAlign: "center",
    },
    {
      field: "process",
      headerName: "Process",
      width: 150,
      headerAlign: "center",
    },
    {
      field: "area_room",
      headerName: "Area Room",
      width: 200,
      headerAlign: "center",
    },
    {
      field: "computer_type",
      headerName: "Computer Type",
      width: 200,
      headerAlign: "center",
      renderCell: (params) => (
        <div>
          {params.row.computer_type === "Desktop" ? (
            <ConnectedTvTwoToneIcon style={{ color: "green" }} /> // Replace with the icon for Desktop
          ) : (
            <LaptopTwoToneIcon style={{ color: "blue" }} /> // Replace with the icon for Notebook
          )}
          &nbsp;&nbsp;{params.value}
        </div>
      ),
    },
  ];

  return (
    <>
      <div style={{ height: 800, width: "100%" }}>
        <DataGrid
          // {...data}
          rows={computers}
          columns={columns}
          loading={!computers.length}
          slots={{ toolbar: CustomToolbar }}
        />
      </div>
    </>
  );
}
