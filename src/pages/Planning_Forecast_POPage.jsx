// import * as React from 'react';
import { useState, useEffect } from "react";
import SearchFacSeriesProd_Fc from "../components/SearchGroup/SearchFacSeriesProd_Fc";
import CircularProgress from "@mui/material/CircularProgress";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
// import Button from "@mui/material/Button";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExportContainer,
  GridCsvExportMenuItem,
  useGridApiContext,
  gridFilteredSortedRowIdsSelector,
  gridVisibleColumnFieldsSelector,
} from "@mui/x-data-grid";
import CloseIcon from "@mui/icons-material/Close"; // Import CloseIcon
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import axios from "axios";
// import { isNull } from "lodash";
import Nav from "../components/Nav";
import "./styles/Planning_Forecast_POPage.css";
import Container from "@mui/material/Container";

// import { Container } from "@mui/material";

export default function Planning_Forecast_POPage({ onSearch }) {
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

  // For Select Data //
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [runningNumber, setRunningNumber] = useState(1); //use for table
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [selectedPoBal, setSelectedPoBal] = useState(null);
  const [selectedFgDet, setSelectedFgDet] = useState(null);
  const [selectedFgunDet, setSelectedFgunDet] = useState(null);
  const [selectedWipPenDet, setSelectedWipPenDet] = useState(null);
  const [selectedWipDet, setSelectedWipDet] = useState(null);

  // For Fetch Data //
  const [wk_no, setWeekNumbers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [po_alls, setPo_All] = useState([]);
  const [po_rec, setPoRec] = useState([]);
  const [po_due, setPoDue] = useState([]);
  const [poBalData, setPoBalData] = useState(
    Array.from({ length: wk_no.length }, () => "0")
  );
  const [Fg, setFg] = useState([]);
  const [wip, setWip] = useState([]);
  const [monDate, setMonDate] = useState([]);
  const [actualShips, setActualShips] = useState([]);
  const [pdShow, setpdShow] = useState([]);
  const [fetchedProductData, setFetchedProductData] = useState([]);
  const [fcFlatData, setFcFlatData] = useState([]);
  const [wipPending, setWipPending] = useState([]);
  const [FgUnmovement, setFgUnmovement] = useState([]);
  const [fcAccuracy, setfcAccuracy] = useState([]);
  const [fcLatest, setfcLatest] = useState([]);

  // const [FgUnmovementDet, setFgUnmovementDet] = useState([]);

  // For Modal //
  const [isModalOpen_PODet, setIsModalOpen_PODet] = useState(false);
  const [poBalDetails, setpoBalDetails] = useState([]);
  //
  const [isModalOpen_FGDet, setIsModalOpen_FGDet] = useState(false);
  const [FGDetails, setFGDetails] = useState([]);
  //
  const [isModalOpen_FGunDet, setIsModalOpen_FGunDet] = useState(false);
  const [FGunDetails, setFGunDetails] = useState([]);
  //
  const [isModalOpen_WipPenDet, setIsModalOpen_WipPenDet] = useState(false);
  const [WipPenDetails, setWipPenDetails] = useState([]);
  //
  const [isModalOpen_WipDet, setIsModalOpen_WipDet] = useState(false);
  const [WipDetails, setWipDetails] = useState([]);

  function formatNumberWithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  const fetchData_week = async () => {
    try {
      const response = await axios.get(
        `http://10.17.66.242:3001/api/smart_planning/get-week`
      );
      // const data = await response.data;
      // const data = await response.json();
      // if (!response.ok) {
      //     throw new Error('Network response was not OK');
      // }
      const wk_no = await response.data;
      const weekNumbers = wk_no.map((weekObj) => weekObj.wk);
      const mon_date = wk_no.map((weekObj) => weekObj.mon_date);

      setWeekNumbers(weekNumbers);
      setMonDate(mon_date);
    } catch (error) {
      console.error("Error fetching data:", error);
      // setError('An error occurred while fetching data week');
      setError(`An error occurred while fetching data week: ${error.message}`);
    } finally {
      setIsLoading(false); // Set isLoading back to false when fetch is complete
    }
  };

  const fetchData_fc = async (
    prd_name = selectedProduct,
    prd_series = selectedSeries
  ) => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `http://10.17.66.242:3001/api/smart_planning/filter-fc-by-product-series?prd_series=${selectedSeries}&prd_name=${selectedProduct}`
      );
      // if (!response.ok) {
      //     throw new Error('Network response was not OK');
      // }
      // const data = await response.json();
      const data = await response.data;
      setProducts(data);
      setRunningNumber(1); // Reset the running number to 1
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("An error occurred while fetching data Forecast");
    } finally {
      setIsLoading(false); // Set isLoading back to false when fetch is complete
    }
  };

  const fetchData_po = async (
    prd_name = selectedProduct,
    prd_series = selectedSeries
  ) => {
    try {
      // setIsLoading(true);
      const response = await axios.get(
        `http://10.17.66.242:3001/api/smart_planning/filter-po-all-product-series?prd_series=${selectedSeries}&prd_name=${selectedProduct}`
      );
      // if (!response.ok) {
      //     throw new Error('Network response was not OK');
      // }
      // const data = await response.json();
      const data = await response.data;

      const poRecData = {};
      data.forEach((item) => {
        poRecData[item.wk] = item.qty_rec;
      });

      const poDueData = {};
      data.forEach((item) => {
        poDueData[item.wk] = item.qty_due;
      });

      const FgData = {};
      data.forEach((item) => {
        FgData[item.wk] = item.qty_fg;
      });

      const WipData = {};
      data.forEach((item) => {
        WipData[item.wk] = item.qty_wip;
      });

      setPo_All(data);
      setPoRec(poRecData);
      setPoDue(poDueData);
      setFg(FgData);
      setWip(WipData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("An error occurred while fetching data Po_All");
    } finally {
      setIsLoading(false); // Set isLoading back to false when fetch is complete
    }
  };

  // const fetchData_pobal = async (
  //     prd_name = selectedProduct,
  //     prd_series = selectedSeries,
  // ) => {
  // try {
  //     // setIsLoading(true);
  //     const response = await fetch(`http://10.17.66.242:3001/api/smart_planning/filter-po-bal-product-series?prd_series=${selectedSeries}&prd_name=${selectedProduct}`);
  //     if (!response.ok) {
  //         throw new Error('Network response was not OK');
  //     }
  //     const data = await response.json();
  //     const poBalData = {};
  //     data.forEach(item => {
  //         poBalData[item.wk] = item.qty_bal;
  //     });

  //     setPoBalData(poBalData);
  //     } catch (error) {
  //     console.error('Error fetching data:', error);
  //     setError('An error occurred while fetching data Po_Bal');
  //     }
  // };

  const fetchData_ActualShip = async (
    prd_name = selectedProduct,
    prd_series = selectedSeries
  ) => {
    try {
      // setIsLoading(true);
      const response = await axios.get(
        `http://10.17.66.242:3001/api/smart_planning/filter-actual-ship-summary-product-series?prd_series=${selectedSeries}&prd_name=${selectedProduct}`
      );
      // if (!response.ok) {
      //     throw new Error('Network response was not OK');
      // }
      // const data = await response.json();
      const data = await response.data;
      const ActualData = {};
      data.forEach((item) => {
        ActualData[item.wk] = item.qty_ship;
      });
      setActualShips(ActualData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("An error occurred while fetching data Actual ship Summary");
    } finally {
      setIsLoading(false); // Set isLoading back to false when fetch is complete
    }
  };

  const fetchData_PDshow = async (
    prd_name = selectedProduct,
    prd_series = selectedSeries
  ) => {
    try {
      // setIsLoading(true);
      const response = await axios.get(
        `http://10.17.66.242:3001/api/smart_planning/filter-show-product-series?prd_series=${selectedSeries}&prd_name=${selectedProduct}`
      );
      // if (!response.ok) {
      //     throw new Error('Network response was not OK');
      // }
      // const data = await response.json();
      const data = await response.data;
      setpdShow(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("An error occurred while fetching data product show");
    } finally {
      setIsLoading(false); // Set isLoading back to false when fetch is complete
    }
  };

  const fetchData_FcFlat = async (
    prd_name = selectedProduct,
    prd_series = selectedSeries
  ) => {
    try {
      const response = await axios.get(
        `http://10.17.66.242:3001/api/smart_planning/filter-fc-diff-prev-curr?prd_series=${prd_series}&prd_name=${prd_name}`
      );
      // if (!response.ok) {
      //     throw new Error('Network response was not OK');
      // }
      // const data = await response.json();
      const data = await response.data;
      const FlatData = {};
      data.forEach((item) => {
        FlatData[item.wk] = item.qty_fc;
      });
      setFcFlatData(FlatData); // Update the state with fetched data
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("An error occurred while fetching data FC_FLAT");
    } finally {
      setIsLoading(false); // Set isLoading back to false when fetch is complete
    }
  };

  const [sumQtyBal, setSumQtyBal] = useState(0);
  const fetchData_poBalDetail = async (
    prd_name = selectedProduct,
    prd_series = selectedSeries
  ) => {
    try {
      //   setIsLoading(true);
      const response = await axios.get(
        `http://10.17.66.242:3001/api/smart_planning/filter-po-bal-detail-product-series?prd_series=${selectedSeries}&prd_name=${selectedProduct}`
      );
      //   if (!response.ok) {
      //     throw new Error('Network response was not OK');
      //   }
      //   const data = await response.json();
      const data = await response.data;
      setpoBalDetails(data); // Update the state variable name
      const sum = data.reduce((total, item) => total + item.qty_bal, 0);
      setSumQtyBal(sum);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("An error occurred while fetching data Po Bal Details");
    } finally {
      setIsLoading(false); // Set isLoading back to false when fetch is complete
    }
  };

  const fetchData_WipPending = async (
    prd_name = selectedProduct,
    prd_series = selectedSeries
  ) => {
    try {
      //   setIsLoading(true);
      const response = await axios.get(
        `http://10.17.66.242:3001/api/smart_planning/filter-wip-pending-product-series?prd_series=${selectedSeries}&prd_name=${selectedProduct}`
      );
      //   if (!response.ok) {
      //     throw new Error('Network response was not OK');
      //   }
      //   const data = await response.json();
      const data = await response.data;
      const wipPendingData = {};
      data.forEach((item) => {
        wipPendingData[item.wk] = item.qty_pending;
      });
      setWipPending(data); // Update the state variable name
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("An error occurred while fetching data Wip Pending");
    } finally {
      setIsLoading(false); // Set isLoading back to false when fetch is complete
    }
  };

  const fetchData_Fgunmovement = async (
    prd_name = selectedProduct,
    prd_series = selectedSeries
  ) => {
    try {
      //   setIsLoading(true);
      const response = await axios.get(
        `http://10.17.66.242:3001/api/smart_planning/filter-fg-unmovement-product-series?prd_series=${selectedSeries}&prd_name=${selectedProduct}`
      );
      //   if (!response.ok) {
      //     throw new Error('Network response was not OK');
      //   }
      // const data = await response.json();
      const data = await response.data;
      const fgUnmovementData = {};
      data.forEach((item) => {
        fgUnmovementData[item.wk] = item.qty_hold;
      });
      setFgUnmovement(fgUnmovementData); // Update the state variable name
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("An error occurred while fetching data FG Unmovement");
    } finally {
      setIsLoading(false); // Set isLoading back to false when fetch is complete
    }
  };

  const [sumQtyFg, setsumQtyFg] = useState(0);
  const fetchData_FGDetails = async (
    prd_name = selectedProduct,
    prd_series = selectedSeries
  ) => {
    try {
      // setIsLoading(true);
      const response = await axios.get(
        `http://10.17.66.242:3001/api/smart_planning/filter-fg-details-product-series?prd_series=${selectedSeries}&prd_name=${selectedProduct}`
      );
      // if (!response.ok) {
      //     throw new Error('Network response was not OK');
      // }
      // const data = await response.json();
      const data = await response.data;
      // Add a unique id property to each row
      const rowsWithId = data.map((row, index) => ({
        ...row,
        id: index, // You can use a better unique identifier here if available
      }));
      setFGDetails(rowsWithId);
      const sum = data.reduce((total, item) => total + item.qty_good, 0);
      setsumQtyFg(sum);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("An error occurred while fetching data FG Details");
    } finally {
      setIsLoading(false); // Set isLoading back to false when fetch is complete
    }
  };

  const fetchData_FGunDetails = async (
    prd_name = selectedProduct,
    prd_series = selectedSeries
  ) => {
    try {
      // setIsLoading(true);
      const response = await axios.get(
        `http://10.17.66.242:3001/api/smart_planning/filter-fg-unmovement-details-product-series?prd_series=${selectedSeries}&prd_name=${selectedProduct}`
      );
      // if (!response.ok) {
      //     throw new Error('Network response was not OK');
      // }
      // const data = await response.json();
      const data = await response.data;
      // Add a unique id property to each row
      const rowsWithId = data.map((row, index) => ({
        ...row,
        id: index, // You can use a better unique identifier here if available
      }));
      setFGunDetails(rowsWithId);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("An error occurred while fetching data FG Unmovement Details");
    } finally {
      setIsLoading(false); // Set isLoading back to false when fetch is complete
    }
  };

  const fetchData_WipPenDetails = async (
    prd_name = selectedProduct,
    prd_series = selectedSeries
  ) => {
    try {
      // setIsLoading(true);
      const response = await axios.get(
        `http://10.17.66.242:3001/api/smart_planning/filter-wip-pending-detail-product-series?prd_series=${selectedSeries}&prd_name=${selectedProduct}`
      );
      // if (!response.ok) {
      //     throw new Error('Network response was not OK');
      // }
      // const data = await response.json();
      const data = await response.data;
      // Add a unique id property to each row
      const rowsWithId = data.map((row, index) => ({
        ...row,
        id: index, // You can use a better unique identifier here if available
      }));
      setWipPenDetails(rowsWithId);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("An error occurred while fetching data Wip Pending Details");
    } finally {
      setIsLoading(false); // Set isLoading back to false when fetch is complete
    }
  };

  const [sumQtyWip, setsumQtyWip] = useState(0);
  const fetchData_WipDetails = async (
    prd_name = selectedProduct,
    prd_series = selectedSeries
  ) => {
    try {
      // setIsLoading(true);
      const response = await axios.get(
        `http://10.17.66.242:3001/api/smart_planning/filter-wip-detail-product-series?prd_series=${selectedSeries}&prd_name=${selectedProduct}`
      );
      // if (!response.ok) {
      //     throw new Error('Network response was not OK');
      // }
      // const data = await response.json();
      const data = await response.data;
      // Add a unique id property to each row
      const rowsWithId = data.map((row, index) => ({
        ...row,
        id: index, // You can use a better unique identifier here if available
      }));
      setWipDetails(rowsWithId);
      const sum = data.reduce((total, item) => total + item.qty_wip_detail, 0);
      setsumQtyWip(sum);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("An error occurred while fetching data Wip Details");
    } finally {
      setIsLoading(false); // Set isLoading back to false when fetch is complete
    }
  };

  const fetchData_fc_accuracy = async (
    prd_name = selectedProduct,
    prd_series = selectedSeries
  ) => {
    try {
      // setIsLoading(true);
      const response = await axios.get(
        `http://10.17.66.242:3001/api/smart_planning/filter-fc-accuracy-product-series?prd_series=${selectedSeries}&prd_name=${selectedProduct}`
      );
      // if (!response.ok) {
      //     throw new Error('Network response was not OK');
      // }
      // const data = await response.json();
      const data = await response.data;
      // console.log(data);
      const fcAccuracyData = {};
      data.forEach((item) => {
        fcAccuracyData[item.wk] = item.fc_accuracy;
      });
      // console.log(fcAccuracyData);
      setfcAccuracy(fcAccuracyData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("An error occurred while fetching data accuracy");
    } finally {
      setIsLoading(false); // Set isLoading back to false when fetch is complete
    }
  };

  const fetchData_fc_latest = async (
    prd_name = selectedProduct,
    prd_series = selectedSeries
  ) => {
    try {
      // setIsLoading(true);
      const response = await axios.get(
        `http://10.17.66.242:3001/api/smart_planning/filter-fc-latest-product-series?prd_series=${selectedSeries}&prd_name=${selectedProduct}`
      );
      // if (!response.ok) {
      //     throw new Error('Network response was not OK');
      // }
      // const data = await response.json();
      const data = await response.data;
      // console.log(data);
      const fcLatestData = {};
      data.forEach((item) => {
        fcLatestData[item.wk] = item.qty_fc;
      });
      // console.log(fcLatestData);
      setfcLatest(fcLatestData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("An error occurred while fetching data accuracy");
    } finally {
      setIsLoading(false); // Set isLoading back to false when fetch is complete
    }
  };

  useEffect(() => {
    //ต้องมี userEffect เพื่อให้รับค่าจาก อีก component ได้ต่อเนื่อง realtime หากไม่มีจะต้องกดปุ่ม 2 รอบ
    fetchData_week();
    fetchData_fc();
    fetchData_po();
    fetchData_ActualShip();
    fetchData_FcFlat();
    fetchData_poBalDetail();
    fetchData_WipPending();
    fetchData_Fgunmovement();
    fetchData_FGDetails();
    fetchData_FGunDetails();
    fetchData_WipPenDetails();
    fetchData_WipDetails();
    fetchData_fc_accuracy();
    fetchData_fc_latest();

    console.log("Product", selectedProduct);
    if (selectedProduct === null) {
      console.log("No Fetch");
    } else {
      console.log("Fetch");
      fetchData_PDshow();
    }
  }, [selectedProduct, selectedSeries]);
  // console.log("Product" , selectedProduct);

  useEffect(() => {
    const prdNames = pdShow.map((item) => item.prd_name);
    if (prdNames.length === 0) {
      setFetchedProductData("");
    } else {
      setFetchedProductData(prdNames);
    }
  }, [pdShow]);

  function chunkArray(array, chunkSize) {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize));
    }
    return result;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const dataByProduct = {};
  products.forEach((product) => {
    if (!dataByProduct[product.pfd_period_no]) {
      dataByProduct[product.pfd_period_no] = {
        pfd_period_no: product.pfd_period_no,
        qty_fc: {},
      };
    }
    dataByProduct[product.pfd_period_no].qty_fc[product.wk] = product.qty_fc;
  });

  // const fcLatestData = {};
  // wk_no.forEach(week => {
  //     const week4Chars = week.slice(-4);
  //     fcLatestData[week] = Object.values(dataByProduct).reduce((latest, productData) => {
  //         const period4Chars = productData.pfd_period_no.slice(-4);
  //         if (period4Chars === week4Chars) {
  //             const qty_fc = productData.qty_fc[week];
  //             return qty_fc !== undefined ? qty_fc : 0;
  //         } else {
  //             // If period4Chars !== week4Chars, update qty_fc with the value from 'week'
  //             const qty_fc = productData.qty_fc[week];
  //             if (qty_fc !== undefined) {
  //                 latest = qty_fc;
  //             }
  //         }
  //         return latest;
  //     }, 0);
  // });

  // Modal //
  const style_Modal = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "white",
    boxShadow: 24,
    p: 4,
  };
  ////////////// Modal PO_Bal by Details //////////////////////////////////
  const openModal_PoBalDetails = (poBalValue) => {
    if (poBalValue > 0) {
      setSelectedPoBal(poBalValue);
      setIsModalOpen_PODet(true);
    }
  };
  const closeModal_PoBalDetails = () => {
    setSelectedPoBal(null);
    setIsModalOpen_PODet(false);
  };

  const columns_PoBalDetails = [
    { field: "prd_name", headerName: "Product Name", width: 200 },
    { field: "so_line", headerName: "SO Line", width: 200 },
    { field: "so_no", headerName: "SO Number", width: 200 },
    { field: "request_date", headerName: "Req. Date", width: 200 },
    { field: "due_date", headerName: "Due. Date", width: 200 },
    { field: "qty_bal", headerName: "Qty Bal", width: 200 },
  ];

  ////////////// Modal FG by Details //////////////////////////////////
  const openModal_FGDetails = (FgDetValue) => {
    if (FgDetValue > 0) {
      setSelectedFgDet(FgDetValue);
      setIsModalOpen_FGDet(true);
    }
  };
  const closeModal_FGDetails = () => {
    setSelectedFgDet(null);
    setIsModalOpen_FGDet(false);
  };

  const columns_FGDetails = [
    { field: "prd_name", headerName: "Product Name", width: 200 },
    { field: "prd_series", headerName: "Product Series", width: 200 },
    { field: "ld_loc", headerName: "Location", width: 200 },
    { field: "ld_status", headerName: "Status", width: 200 },
    { field: "qty_good", headerName: "Qty Good", width: 200 },
  ];

  ////////////// Modal FG Unmovement by Details //////////////////////////////////
  const openModal_FGunDetails = (FgunDetValue) => {
    if (FgunDetValue > 0) {
      setSelectedFgunDet(FgunDetValue);
      setIsModalOpen_FGunDet(true);
    }
  };
  const closeModal_FGunDetails = () => {
    setSelectedFgunDet(null);
    setIsModalOpen_FGunDet(false);
  };

  const columns_FGunDetails = [
    { field: "prd_name", headerName: "Product Name", width: 200 },
    { field: "prd_series", headerName: "Product Series", width: 200 },
    { field: "ld_loc", headerName: "Location", width: 200 },
    { field: "ld_status", headerName: "Status", width: 200 },
    { field: "qty_hold", headerName: "Qty Hold", width: 200 },
  ];

  ////////////// Modal Wip Pending by Details //////////////////////////////////
  const openModal_WipPenDetails = (WipPenDetValue) => {
    if (WipPenDetValue > 0) {
      setSelectedWipPenDet(WipPenDetValue);
      setIsModalOpen_WipPenDet(true);
    }
  };
  const closeModal_WipPenDetails = () => {
    setSelectedWipPenDet(null);
    setIsModalOpen_WipPenDet(false);
  };

  const columns_WipPenDetails = [
    { field: "prd_name", headerName: "Product Name", width: 200 },
    { field: "lot", headerName: "Lot No.", width: 200 },
    { field: "prd_series", headerName: "Product Series", width: 100 },
    { field: "factory", headerName: "Factory", width: 100 },
    { field: "unit", headerName: "Unit", width: 100 },
    { field: "process", headerName: "Process", width: 100 },
    { field: "pending_reason", headerName: "Reason", width: 200 },
    { field: "qty_pending", headerName: "Qty Pending", width: 200 },
  ];

  ////////////// Modal Wip by Details //////////////////////////////////
  const openModal_WipDetails = (WipDetValue) => {
    if (WipDetValue > 0) {
      setSelectedWipDet(WipDetValue);
      setIsModalOpen_WipDet(true);
    }
  };
  const closeModal_WipDetails = () => {
    setSelectedWipDet(null);
    setIsModalOpen_WipDet(false);
  };

  const columns_WipDetails = [
    { field: "prd_name", headerName: "Product Name", width: 200 },
    { field: "prd_series", headerName: "Product Series", width: 200 },
    { field: "factory", headerName: "Factory", width: 200 },
    { field: "unit", headerName: "Unit", width: 200 },
    { field: "process", headerName: "Process", width: 200 },
    { field: "qty_wip_detail", headerName: "Net Qty WIP Detail", width: 200 },
    { field: "std_day", headerName: "Remain to WH(Days)", width: 150 },
  ];

  let result_1 = sumQtyBal;
  let result_2,
    result_3,
    result_4,
    result_5,
    result_6,
    result_7,
    result_8,
    result_9,
    result_10,
    result_11 = 0;

  return (
    <>
      <div className="po-container">
        <Container maxWidth="lg">
          <Box>
            <Nav />
            {/* style={{ display: 'flex', flexDirection: 'row' }} */}
            <div>
              <SearchFacSeriesProd_Fc
                onSearch={(queryParams) => {
                  setSelectedProduct(queryParams.prd_name);
                  setSelectedSeries(queryParams.prd_series);
                  // fetchData_PDshow();
                }}
              />
              <div id="pdShowLabel" style={{ width: "100%" }}>
                {selectedProduct === "Product" ? (
                  <div
                    style={{
                      backgroundColor: "#E4F1FF",
                      fontSize: "14px",
                      fontFamily: "Angsana News, sans-serif",
                      color: "#952323",
                    }}
                  >
                    {selectedSeries}
                  </div> // Render an empty div if selectedProduct is "Empty"
                ) : (
                  chunkArray(fetchedProductData, 10).map((chunk, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: "#E4F1FF",
                        fontSize: "14px",
                        fontFamily: "Angsana News, sans-serif",
                        color: "#952323",
                      }}
                    >
                      {chunk.join(" ::: ")}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div
              className="table-responsive_table-fullscreen"
              // style={{ height: 800, width: "100%", marginTop: "5px" }}
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
                <table
                  className="table table-striped table-bordered table-hover blue-theme small"
                  style={{
                    fontSize: "11px",
                    fontFamily: "Arial, Helvetica, sans-serif",
                  }}
                >
                  <thead
                    className="thead-dark"
                    style={{ position: "sticky", top: "0", zIndex: "1" }}
                  >
                    {/* className="table table-hover blue-theme table-very-small" */}
                    <tr>
                      {/* <th>Row No</th> */}
                      <th
                        style={{
                          textAlign: "center",
                          backgroundColor: "#AED2FF",
                          height: "40px",
                          width: "110px",
                        }}
                      >
                        Week
                      </th>
                      {wk_no.map((week, index) => {
                        let backgroundColor = "";
                        let fontColor = "";

                        if (index < 12) {
                          backgroundColor = "#E4F1FF";
                        } else if (index > 12) {
                          backgroundColor = "#E4F1FF";
                        } else {
                          (backgroundColor = "#279EFF"),
                            (fontColor = "#F3FDE8");
                        }

                        return (
                          <th
                            key={index}
                            style={{
                              backgroundColor: backgroundColor,
                              color: fontColor,
                              textAlign: "center",
                              width: "60px",
                            }}
                          >
                            {week}
                          </th>
                        );
                      })}
                    </tr>
                    <tr>
                      <th
                        style={{
                          textAlign: "center",
                          backgroundColor: "#AED2FF",
                          height: "40px",
                        }}
                      >
                        Period No. / Date
                      </th>
                      {monDate.map((date, index) => {
                        let backgroundColor = "";
                        let fontColor = "";

                        if (index < 12) {
                          backgroundColor = "#E4F1FF";
                        } else if (index > 12) {
                          backgroundColor = "#E4F1FF";
                        } else {
                          (backgroundColor = "#279EFF"),
                            (fontColor = "#F3FDE8");
                        }

                        return (
                          <th
                            key={index}
                            style={{
                              backgroundColor: backgroundColor,
                              color: fontColor,
                              textAlign: "center",
                            }}
                          >
                            {date}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(dataByProduct).map((productData, index) => (
                      <tr key={productData.pfd_period_no}>
                        <td
                          style={{
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          {productData.pfd_period_no}
                        </td>
                        {wk_no.map((week, weekIndex) => {
                          let backgroundColor = "white"; // Default background color
                          let fontColor_wk = "";
                          const Period4Chars =
                            productData.pfd_period_no.slice(-4);
                          const Week4Chars = week.slice(-4);

                          if (weekIndex === 12) {
                            backgroundColor = "#CEE6F3";
                            fontColor_wk = "#0E21A0";
                          } else if (Period4Chars === Week4Chars) {
                            backgroundColor = "#B9B4C7"; // Set background color to your desired color if weekIndex is 12
                          }

                          const totalRows = Object.values(dataByProduct).length;
                          // let previousResult = 0;
                          let qtyFc =
                            productData.qty_fc[week] !== undefined
                              ? productData.qty_fc[week]
                              : 0;
                          // let result = productData.qty_fc[week] !== undefined ? sumQtyBal - productData.qty_fc[week] : 0;
                          if (index === totalRows - 1) {
                            // Apply conditions only to the last row
                            if (weekIndex === 12) {
                              result_1 = result_1 - qtyFc;
                              if (result_1 >= 0) {
                                backgroundColor = "#A6FF96";
                              } else if (result_1 < 0) {
                                backgroundColor = "#EF9595";
                              }
                            }
                            if (weekIndex === 13) {
                              result_2 = result_1 - qtyFc;
                              if (result_2 >= 0) {
                                backgroundColor = "#A6FF96";
                              } else if (result_2 < 0) {
                                backgroundColor = "#EF9595";
                              }
                            }

                            if (weekIndex === 14) {
                              result_3 = result_2 - qtyFc;
                              if (result_3 >= 0) {
                                backgroundColor = "#A6FF96";
                              } else if (result_3 < 0) {
                                backgroundColor = "#EF9595";
                              }
                            }

                            if (weekIndex === 15) {
                              result_4 = result_3 - qtyFc;
                              if (result_4 >= 0) {
                                backgroundColor = "#A6FF96";
                              } else if (result_4 < 0) {
                                backgroundColor = "#EF9595";
                              }
                            }

                            if (weekIndex === 16) {
                              result_5 = result_4 - qtyFc;
                              if (result_5 >= 0) {
                                backgroundColor = "#A6FF96";
                              } else if (result_5 < 0) {
                                backgroundColor = "#EF9595";
                              }
                            }

                            if (weekIndex === 17) {
                              result_6 = result_5 - qtyFc;
                              if (result_6 >= 0) {
                                backgroundColor = "#A6FF96";
                              } else if (result_6 < 0) {
                                backgroundColor = "#EF9595";
                              }
                            }

                            if (weekIndex === 18) {
                              result_7 = result_6 - qtyFc;
                              if (result_7 >= 0) {
                                backgroundColor = "#A6FF96";
                              } else if (result_7 < 0) {
                                backgroundColor = "#EF9595";
                              }
                            }

                            if (weekIndex === 19) {
                              result_8 = result_7 - qtyFc;
                              if (result_8 >= 0) {
                                backgroundColor = "#A6FF96";
                              } else if (result_8 < 0) {
                                backgroundColor = "#EF9595";
                              }
                            }

                            if (weekIndex === 20) {
                              result_9 = result_8 - qtyFc;
                              if (result_9 >= 0) {
                                backgroundColor = "#A6FF96";
                              } else if (result_9 < 0) {
                                backgroundColor = "#EF9595";
                              }
                            }

                            if (weekIndex === 21) {
                              result_10 = result_9 - qtyFc;
                              if (result_10 >= 0) {
                                backgroundColor = "#A6FF96";
                              } else if (result_10 < 0) {
                                backgroundColor = "#EF9595";
                              }
                            }

                            if (weekIndex === 22) {
                              result_11 = result_10 - qtyFc;
                              if (result_11 >= 0) {
                                backgroundColor = "#A6FF96";
                              } else if (result_11 < 0) {
                                backgroundColor = "#EF9595";
                              }
                            }
                          }

                          return (
                            <td
                              key={weekIndex}
                              style={{
                                textAlign: "center",
                                backgroundColor: backgroundColor,
                                color: fontColor_wk,
                                height: "30px",
                              }}
                            >
                              {productData.qty_fc[week] !== undefined
                                ? formatNumberWithCommas(
                                    productData.qty_fc[week]
                                  )
                                : "0"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    <tr>
                      <td
                        style={{
                          color: "blue",
                          fontWeight: "bold",
                          textAlign: "right",
                          backgroundColor: "#E4F1FF",
                          height: "30px",
                        }}
                      >
                        FC_Latest :
                      </td>
                      {wk_no.map((week, weekIndex) => {
                        const fcLatestDataValue = fcLatest[week];
                        return (
                          <td
                            key={weekIndex}
                            style={{
                              textAlign: "center",
                              backgroundColor: "#E4F1FF",
                              color: weekIndex === 12 ? "#0E21A0" : "black",
                              fontWeight: weekIndex === 12 ? "bold" : "normal",
                            }}
                          >
                            {fcLatestDataValue !== undefined
                              ? formatNumberWithCommas(fcLatestDataValue)
                              : "0"}
                            {/* {recValue !== undefined ? (recValue !== 0 ? recValue : "--") : "--"} */}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td
                        style={{
                          color: "blue",
                          fontWeight: "bold",
                          textAlign: "right",
                          backgroundColor: "#AED2FF",
                          height: "30px",
                        }}
                      >
                        FC_Fluctuation :
                      </td>
                      {wk_no.map((week, weekIndex) => {
                        const FlatValue = fcFlatData[week];
                        const isNegative =
                          FlatValue && FlatValue.charAt(0) === "-";
                        return (
                          <td
                            key={weekIndex}
                            style={{
                              textAlign: "center",
                              backgroundColor: "#AED2FF",
                              color: isNegative
                                ? "red"
                                : weekIndex === 12
                                ? "#0E21A0"
                                : "black",
                              fontWeight: weekIndex === 12 ? "bold" : "normal",
                            }}
                          >
                            {FlatValue !== undefined
                              ? formatNumberWithCommas(FlatValue)
                              : "0"}
                          </td>
                        );
                      })}
                    </tr>

                    <tr>
                      <td
                        style={{
                          color: "blue",
                          fontWeight: "bold",
                          textAlign: "right",
                          backgroundColor: "#E4F1FF",
                          height: "30px",
                        }}
                      >
                        FC_Accuracy(%) :
                      </td>
                      {wk_no.map((week, weekIndex) => {
                        const fcAccuracyValue = fcAccuracy[week];
                        const fcAccuracyValues =
                          fcAccuracyValue !== undefined
                            ? parseInt(fcAccuracyValue)
                            : "-";
                        return (
                          <td
                            key={weekIndex}
                            style={{
                              textAlign: "center",
                              backgroundColor: "#E4F1FF",
                              color: weekIndex === 12 ? "#0E21A0" : "black",
                              fontWeight: weekIndex === 12 ? "bold" : "normal",
                            }}
                          >
                            {/* {fcAccuracyValues !== undefined ? formatNumberWithCommas(fcAccuracyValues) + "" : "-"} */}
                            {fcAccuracyValues !== undefined
                              ? `${formatNumberWithCommas(fcAccuracyValues)}${
                                  fcAccuracyValues > 0 ? " %" : ""
                                }`
                              : "-"}

                            {/* {fcAccuracyValues !== undefined ? `${formatNumberWithCommas(fcAccuracyValues)} %` : "0 %"} */}
                            {/* {recValue !== undefined ? (recValue !== 0 ? recValue : "--") : "--"} */}
                          </td>
                        );
                      })}
                    </tr>

                    <tr>
                      {/* <td></td> */}
                      <td
                        style={{
                          color: "blue",
                          fontWeight: "bold",
                          textAlign: "right",
                          backgroundColor: "#AED2FF",
                          height: "30px",
                        }}
                      >
                        PO_REC :
                      </td>
                      {wk_no.map((week, weekIndex) => {
                        const recValue = po_rec[week];
                        return (
                          <td
                            key={weekIndex}
                            style={{
                              textAlign: "center",
                              backgroundColor: "#AED2FF",
                              color: weekIndex === 12 ? "#0E21A0" : "black",
                              fontWeight: weekIndex === 12 ? "bold" : "normal",
                            }}
                          >
                            {recValue !== undefined
                              ? formatNumberWithCommas(recValue)
                              : "0"}
                            {/* {recValue !== undefined ? (recValue !== 0 ? recValue : "--") : "--"} */}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      {/* <td></td> */}
                      <td
                        style={{
                          color: "blue",
                          fontWeight: "bold",
                          textAlign: "right",
                          backgroundColor: "#E4F1FF",
                          height: "30px",
                        }}
                      >
                        PO_DUE :
                      </td>
                      {wk_no.map((week, weekIndex) => {
                        const dueValue = po_due[week];
                        return (
                          <td
                            key={weekIndex}
                            style={{
                              textAlign: "center",
                              backgroundColor: "#E4F1FF",
                              color: weekIndex === 12 ? "#0E21A0" : "black",
                              fontWeight: weekIndex === 12 ? "bold" : "normal",
                            }}
                          >
                            {dueValue !== undefined
                              ? formatNumberWithCommas(dueValue)
                              : "0"}
                            {/* {recValue !== undefined ? (recValue !== 0 ? recValue : "--") : "--"} */}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      {/* <td></td> */}
                      <td
                        style={{
                          color: "blue",
                          fontWeight: "bold",
                          textAlign: "right",
                          backgroundColor: "#AED2FF",
                          height: "30px",
                        }}
                      >
                        Actual ship :
                      </td>
                      {wk_no.map((week, weekIndex) => (
                        <td
                          key={weekIndex}
                          style={{
                            textAlign: "center",
                            backgroundColor: "#AED2FF",
                            color: weekIndex === 12 ? "#0E21A0" : "black",
                            fontWeight: weekIndex === 12 ? "bold" : "normal",
                          }}
                        >
                          {actualShips[week] !== undefined
                            ? formatNumberWithCommas(actualShips[week])
                            : "0"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      {/* <td></td> */}
                      <td
                        style={{
                          color: "blue",
                          fontWeight: "bold",
                          textAlign: "right",
                          backgroundColor: "#E4F1FF",
                          height: "30px",
                        }}
                      >
                        PO_BAL :
                      </td>
                      {wk_no.map((week, weekIndex) => (
                        <td
                          key={weekIndex}
                          style={{
                            cursor:
                              weekIndex === 12 && sumQtyBal > 0
                                ? "pointer"
                                : "default",
                            textDecoration:
                              weekIndex === 12 && sumQtyBal > 0
                                ? "underline"
                                : "none",
                            textAlign: "center",
                            backgroundColor: "#E4F1FF",
                            color: weekIndex === 12 ? "#0E21A0" : "black",
                            fontWeight: weekIndex === 12 ? "bold" : "normal",
                            fontSize: weekIndex === 12 ? "12px" : "normal",
                          }}
                          // onClick={() => openModal_PoBalDetails(sumQtyBal)}
                          onClick={() => {
                            if (weekIndex === 12 && sumQtyBal > 0) {
                              openModal_PoBalDetails(sumQtyBal);
                            }
                          }} // Open modal on click
                        >
                          {/* {poBalData[week] !== undefined ? formatNumberWithCommas(poBalData[week]) : "0"} */}
                          {weekIndex === 12
                            ? formatNumberWithCommas(sumQtyBal)
                            : "0"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      {/* <td></td> */}
                      <td
                        style={{
                          color: "blue",
                          fontWeight: "bold",
                          textAlign: "right",
                          backgroundColor: "#E4F1FF",
                          height: "30px",
                        }}
                      >
                        FG :
                      </td>
                      {wk_no.map((week, weekIndex) => {
                        const FgValue = Fg[week];
                        return (
                          <td
                            key={weekIndex}
                            style={{
                              cursor:
                                weekIndex === 12 && sumQtyFg > 0
                                  ? "pointer"
                                  : "default",
                              textDecoration:
                                weekIndex === 12 && sumQtyFg > 0
                                  ? "underline"
                                  : "none",
                              textAlign: "center",
                              backgroundColor: "#E4F1FF",
                              color: weekIndex === 12 ? "#0E21A0" : "black",
                              fontWeight: weekIndex === 12 ? "bold" : "normal",
                              fontSize: weekIndex === 12 ? "12px" : "normal",
                            }}
                            // onClick={() => openModal_FGDetails(sumQtyFg)}
                            onClick={() => {
                              if (weekIndex === 12 && sumQtyFg > 0) {
                                openModal_FGDetails(sumQtyFg);
                              }
                            }} // Open modal on click
                          >
                            {weekIndex === 12
                              ? formatNumberWithCommas(sumQtyFg)
                              : "0"}
                            {/* {FgValue !== undefined ? formatNumberWithCommas(FgValue) : "0"} */}
                            {/* {recValue !== undefined ? (recValue !== 0 ? recValue : "--") : "--"} */}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      {/* <td></td> */}
                      <td
                        style={{
                          color: "blue",
                          fontWeight: "bold",
                          textAlign: "right",
                          backgroundColor: "#E4F1FF",
                          height: "30px",
                        }}
                      >
                        FG Unmovement :
                      </td>
                      {wk_no.map((week, weekIndex) => {
                        const FgUnmovementValue = FgUnmovement[week];
                        return (
                          <td
                            key={weekIndex}
                            style={{
                              cursor:
                                weekIndex === 12 && FgUnmovement[week] > 0
                                  ? "pointer"
                                  : "default",
                              textDecoration:
                                weekIndex === 12 && FgUnmovement[week] > 0
                                  ? "underline"
                                  : "none",
                              textAlign: "center",
                              backgroundColor: "#E4F1FF",
                              color: weekIndex === 12 ? "#0E21A0" : "black",
                              fontWeight: weekIndex === 12 ? "bold" : "normal",
                              fontSize: weekIndex === 12 ? "12px" : "normal",
                            }}
                            // onClick={() => openModal_FGunDetails(FgUnmovement[week])}
                            onClick={() => {
                              if (weekIndex === 12 && FgUnmovement[week] > 0) {
                                openModal_FGunDetails(FgUnmovement[week]);
                              }
                            }} // Open modal on click
                          >
                            {FgUnmovementValue !== undefined
                              ? formatNumberWithCommas(FgUnmovementValue)
                              : "0"}
                            {/* {recValue !== undefined ? (recValue !== 0 ? recValue : "--") : "--"} */}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      {/* <td></td> */}
                      <td
                        style={{
                          color: "blue",
                          fontWeight: "bold",
                          textAlign: "right",
                          backgroundColor: "#E4F1FF",
                          height: "30px",
                        }}
                      >
                        WIP :
                      </td>
                      {wk_no.map((week, weekIndex) => {
                        const WipValue = wip[week];
                        return (
                          <td
                            key={weekIndex}
                            style={{
                              cursor:
                                weekIndex === 12 && sumQtyWip > 0
                                  ? "pointer"
                                  : "default",
                              textDecoration:
                                weekIndex === 12 && sumQtyWip > 0
                                  ? "underline"
                                  : "none",
                              textAlign: "center",
                              backgroundColor: "#E4F1FF",
                              color: weekIndex === 12 ? "#0E21A0" : "black",
                              fontWeight: weekIndex === 12 ? "bold" : "normal",
                              fontSize: weekIndex === 12 ? "12px" : "normal",
                            }}
                            // onClick={() => openModal_WipDetails(sumQtyWip)}
                            onClick={() => {
                              if (weekIndex === 12 && sumQtyWip > 0) {
                                openModal_WipDetails(sumQtyWip);
                              }
                            }} // Open modal on click
                          >
                            {weekIndex === 12
                              ? formatNumberWithCommas(sumQtyWip)
                              : "0"}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      {/* <td></td> */}
                      <td
                        style={{
                          color: "blue",
                          fontWeight: "bold",
                          textAlign: "right",
                          backgroundColor: "#E4F1FF",
                          height: "30px",
                        }}
                      >
                        WIP Pending (1.1,3.1) :
                      </td>
                      {wk_no.map((week, weekIndex) => {
                        return (
                          <th
                            key={weekIndex}
                            style={{
                              cursor:
                                weekIndex === 12 &&
                                wipPending &&
                                wipPending.length > 0
                                  ? "pointer"
                                  : "default",
                              textDecoration:
                                weekIndex === 12 &&
                                wipPending &&
                                wipPending.length > 0
                                  ? "underline"
                                  : "none",
                              textAlign: "center",
                              backgroundColor: "#E4F1FF",
                              color: weekIndex === 12 ? "#0E21A0" : "black",
                              fontWeight: weekIndex === 12 ? "bold" : "normal",
                              fontSize: weekIndex === 12 ? "12px" : "normal",
                            }}
                            // onClick={() => openModal_WipPenDetails(wipPending.length)}
                            onClick={() => {
                              if (weekIndex === 12 && wipPending.length > 0) {
                                openModal_WipPenDetails(wipPending.length);
                              }
                            }} // Open modal on click
                          >
                            {wipPending &&
                            wipPending.length > 0 &&
                            weekIndex === 12
                              ? formatNumberWithCommas(
                                  wipPending[0].qty_pending
                                )
                              : "0"}
                          </th>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              )}

              {/* Modal */}
              {isModalOpen_PODet && (
                <Modal
                  open={isModalOpen_PODet}
                  onClose={closeModal_PoBalDetails}
                  aria-labelledby="child-modal-title"
                  aria-describedby="child-modal-description"
                >
                  <Box
                    sx={{
                      ...style_Modal,
                      width: 1325,
                      height: 800,
                      backgroundColor: "#AED2FF",
                    }}
                  >
                    {/* <h3 style={{textAlign: 'center'}}>PO Balance by Details</h3> */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px",
                      }}
                    >
                      <div
                        style={{
                          textAlign: "center",
                          fontWeight: "bold",
                          fontSize: "20px",
                          marginBottom: "10px",
                        }}
                      >
                        <label htmlFor="">PO Balance by Details</label>
                      </div>
                      <div>
                        <IconButton onClick={closeModal_PoBalDetails}>
                          <CloseIcon />
                        </IconButton>
                      </div>
                    </div>
                    <div style={{ height: 680, width: "100%" }}>
                      <DataGrid
                        // rows={poBalDetails}
                        rows={poBalDetails.map((row) => ({
                          ...row,
                          qty_bal: formatNumberWithCommas(row.qty_bal), // Format the qty_pending field
                        }))}
                        columns={columns_PoBalDetails}
                        loading={!poBalDetails.length}
                        pageSize={10}
                        checkboxSelection
                        // autoPageSize
                        style={{
                          minHeight: "400px",
                          border: "1px solid black",
                          backgroundColor: "#E4F1FF",
                        }}
                        slots={{ toolbar: CustomToolbar }}
                      />
                    </div>
                  </Box>
                </Modal>
              )}

              {isModalOpen_FGDet && (
                <Modal
                  open={isModalOpen_FGDet}
                  onClose={closeModal_FGDetails}
                  aria-labelledby="child-modal-title"
                  aria-describedby="child-modal-description"
                >
                  <Box
                    sx={{
                      ...style_Modal,
                      width: 1120,
                      height: 800,
                      backgroundColor: "#AED2FF",
                    }}
                  >
                    {/* <h3 style={{textAlign: 'center'}}>PO Balance by Details</h3> */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px",
                      }}
                    >
                      <div
                        style={{
                          textAlign: "center",
                          fontWeight: "bold",
                          fontSize: "20px",
                          marginBottom: "10px",
                        }}
                      >
                        <label htmlFor="">FG by Details</label>
                      </div>
                      <div>
                        <IconButton onClick={closeModal_FGDetails}>
                          <CloseIcon />
                        </IconButton>
                      </div>
                    </div>
                    <div style={{ height: 680, width: "100%" }}>
                      <DataGrid
                        // rows={FGDetails}
                        rows={FGDetails.map((row) => ({
                          ...row,
                          qty_good: formatNumberWithCommas(row.qty_good), // Format the qty_pending field
                        }))}
                        columns={columns_FGDetails}
                        // loading={!FGDetails.length}
                        pageSize={10}
                        checkboxSelection
                        // autoPageSize
                        style={{
                          minHeight: "400px",
                          border: "1px solid black",
                          backgroundColor: "#E4F1FF",
                        }}
                        slots={{ toolbar: CustomToolbar }}
                      />
                    </div>
                  </Box>
                </Modal>
              )}

              {isModalOpen_FGunDet && (
                <Modal
                  open={isModalOpen_FGunDet}
                  onClose={closeModal_FGunDetails}
                  aria-labelledby="child-modal-title"
                  aria-describedby="child-modal-description"
                >
                  <Box
                    sx={{
                      ...style_Modal,
                      width: 1120,
                      height: 800,
                      backgroundColor: "#AED2FF",
                    }}
                  >
                    {/* <h3 style={{textAlign: 'center'}}>PO Balance by Details</h3> */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px",
                      }}
                    >
                      <div
                        style={{
                          textAlign: "center",
                          fontWeight: "bold",
                          fontSize: "20px",
                          marginBottom: "10px",
                        }}
                      >
                        <label htmlFor="">FG Unmovement by Details</label>
                      </div>
                      <div>
                        <IconButton onClick={closeModal_FGunDetails}>
                          <CloseIcon />
                        </IconButton>
                      </div>
                    </div>
                    <div style={{ height: 680, width: "100%" }}>
                      <DataGrid
                        // rows={FGunDetails}
                        rows={FGunDetails.map((row) => ({
                          ...row,
                          qty_hold: formatNumberWithCommas(row.qty_hold), // Format the qty_pending field
                        }))}
                        columns={columns_FGunDetails}
                        // loading={!FGDetails.length}
                        pageSize={10}
                        checkboxSelection
                        // autoPageSize
                        style={{
                          minHeight: "400px",
                          border: "1px solid black",
                          backgroundColor: "#E4F1FF",
                        }}
                        slots={{ toolbar: CustomToolbar }}
                      />
                    </div>
                  </Box>
                </Modal>
              )}

              {isModalOpen_WipDet && (
                <Modal
                  open={isModalOpen_WipDet}
                  onClose={closeModal_WipDetails}
                  aria-labelledby="child-modal-title"
                  aria-describedby="child-modal-description"
                >
                  <Box
                    sx={{
                      ...style_Modal,
                      width: 1490,
                      height: 800,
                      backgroundColor: "#AED2FF",
                    }}
                  >
                    {/* <h3 style={{textAlign: 'center'}}>PO Balance by Details</h3> */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px",
                      }}
                    >
                      <div
                        style={{
                          textAlign: "center",
                          fontWeight: "bold",
                          fontSize: "20px",
                          marginBottom: "10px",
                        }}
                      >
                        <label htmlFor="">WIP by Details</label>
                      </div>
                      <div>
                        <IconButton onClick={closeModal_WipDetails}>
                          <CloseIcon />
                        </IconButton>
                      </div>
                    </div>
                    <div style={{ height: 680, width: "100%" }}>
                      <DataGrid
                        // rows={WipDetails}
                        rows={WipDetails.map((row) => ({
                          ...row,
                          qty_wip_detail: formatNumberWithCommas(
                            row.qty_wip_detail
                          ), // Format the qty_pending field
                        }))}
                        columns={columns_WipDetails}
                        // loading={!FGDetails.length}
                        pageSize={10}
                        checkboxSelection
                        // autoPageSize
                        style={{
                          minHeight: "400px",
                          border: "1px solid black",
                          backgroundColor: "#E4F1FF",
                        }}
                        slots={{ toolbar: CustomToolbar }}
                      />
                    </div>
                  </Box>
                </Modal>
              )}

              {isModalOpen_WipPenDet && (
                <Modal
                  open={isModalOpen_WipPenDet}
                  onClose={closeModal_WipPenDetails}
                  aria-labelledby="child-modal-title"
                  aria-describedby="child-modal-description"
                >
                  <Box
                    sx={{
                      ...style_Modal,
                      width: 1330,
                      height: 800,
                      backgroundColor: "#AED2FF",
                    }}
                  >
                    {/* <h3 style={{textAlign: 'center'}}>PO Balance by Details</h3> */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px",
                      }}
                    >
                      <div
                        style={{
                          textAlign: "center",
                          fontWeight: "bold",
                          fontSize: "20px",
                          marginBottom: "10px",
                        }}
                      >
                        <label htmlFor="">WIP Pending by Details</label>
                      </div>
                      <div>
                        <IconButton onClick={closeModal_WipPenDetails}>
                          <CloseIcon />
                        </IconButton>
                      </div>
                    </div>
                    <div style={{ height: 680, width: "100%" }}>
                      <DataGrid
                        // rows={WipPenDetails}
                        rows={WipPenDetails.map((row) => ({
                          ...row,
                          qty_pending: formatNumberWithCommas(row.qty_pending), // Format the qty_pending field
                        }))}
                        columns={columns_WipPenDetails}
                        // loading={!FGDetails.length}
                        pageSize={10}
                        checkboxSelection
                        // autoPageSize
                        style={{
                          minHeight: "400px",
                          border: "1px solid black",
                          backgroundColor: "#E4F1FF",
                        }}
                        slots={{ toolbar: CustomToolbar }}
                      />
                    </div>
                  </Box>
                </Modal>
              )}
            </div>
          </Box>
        </Container>
      </div>
    </>
  );
}
