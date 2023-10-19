import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Button from '@mui/material/Button';
import React, { useState, useEffect } from "react";
import axios from "axios";

function SearchProd_Fc({ onSearch }) {
    const [error , setError] = useState(null);

    //Set Dropdown List
    const [selectedProduct, setSelectedProduct] = useState(null);
    // const [selectedSeries, setSelectedSeries] = useState(null);

    //Set Parameter from API
    const [distinctProduct, setDistinctProduct] = useState([]);
    // const [distinctSeries, setDistinctSeries] = useState([]);

    const fetchProduct = async () => {
        try {
          const response = await fetch("http://10.17.66.242:3001/api/smart_planning/productlist");
          const dataProduct = response.data;
          setDistinctProduct(dataProduct);
        } catch (error) {
          console.error(`Error fetching distinct data ProductList: ${error}`);
        }
    };

    // const fetchSeries = async () => {
    //     try {
    //       const response = await fetch("http://10.17.66.242:3001/api/serieslist");
    //       const dataSeries = response.data;
    //       setDistinctSeries(dataSeries);
    //     } catch (error) {
    //       console.error(`Error fetching distinct data SeriesList: ${error}`);
    //     }
    // };

    if (error) {
        return <div>Error: {error}</div>;
    }

    //สร้าง Function selection change
    // const handleSeriesChange = (event, newValue) => {
    //     console.log(newValue);
    //     setSelectedSeries(newValue);
    //     setSelectedProduct({ prd_name: "Product" });
    // }

    const handleProductChange = (event, newValue) => {
        console.log(newValue);
        setSelectedProduct(newValue);
        // setSelectedSeries({ prd_series: "Series" });
    }

    const handleSearch = () => {
        // console.log("Button search",selectedFactory.factory,selectedUserUpdateBy.user_update_by);
        const queryParams = {
        //   factory: selectedFactory.factory,
        //   department: selectedDepartment.department,
        //   process: selectedProcess.process,
          prd_name: selectedProduct.prd_name,
        //   prd_series: selectedSeries.prd_series,
        };
        onSearch(queryParams); // Invoke the callback function with the selected values
    };

    useEffect(() => {
        fetchProduct();
    }, [selectedProduct]);

    return (
        <React.Fragment>
            <div>
                <h5 style={{ fontSize: 20, fontWeight: 'bold', color: '#6528F7' , 
                    backgroundColor: '#FAF1E4' , width: '200px' , paddingLeft: '5px' , marginBottom : '20px'}}>
                    Forecast Accuracy</h5>
            </div>
            <Box maxWidth="xl" sx={{ width: "100%" , height: 50}}>
                <Grid container spacing={0} style={{width: 1350 }}> 
                    {/* <Grid  item xs={2} md={2} >
                        <div style={{ display: 'grid', placeItems: 'center' }}> 
                            <Autocomplete
                                id="cmb_factory"
                                size="small"
                                sx={{ width: 220 }}
                                options={FactoryList} // กำหนดรายการตัวเลือก
                                getOptionLabel={(option) => option.title} // กำหนดฟิลด์ที่จะแสดงในตัวเลือก
                                renderInput={(params) => <TextField {...params} label="Factory" />} // แสดง input field
                            />
                        </div>
                    </Grid> */}
                    {/* <Grid  item xs={2} md={2} >
                        <div style={{ display: 'grid', placeItems: 'center' }}>
                            <Autocomplete
                                id="cmb_type"
                                size="small"
                                sx={{ width: 220 }}
                                options={SeriesList} // กำหนดรายการตัวเลือก
                                getOptionLabel={(option) => option.title} // กำหนดฟิลด์ที่จะแสดงในตัวเลือก
                                renderInput={(params) => <TextField {...params} label="Series" />} // แสดง input field
                            />
                            <Autocomplete
                                disablePortal
                                id="combo-box-demo-series"
                                size="small"
                                options={distinctSeries}
                                getOptionLabel={(option) => option && option.prd_series}
                                value={selectedSeries}
                                onChange={handleSeriesChange}
                                sx={{ width: 220 }}
                                renderInput={(params) => <TextField {...params} label="Series" />}
                                isOptionEqualToValue={(option, value) =>
                                    option && value && option.prd_series === value.prd_series
                                }
                            />
                        </div>
                    </Grid> */}
                    <Grid  item xs={2} md={2} >
                        <div style={{ display: 'grid', placeItems: 'center' }}>
                            <Autocomplete
                                disablePortal
                                // freeSolo
                                id="combo-box-demo-product"
                                size="small"
                                options={distinctProduct}
                                getOptionLabel={(option) => option && option.prd_name}
                                value={selectedProduct}
                                onChange={handleProductChange}
                                sx={{ width: 240 }}
                                renderInput={(params) => <TextField {...params} label="Product" />}
                                isOptionEqualToValue={(option, value) =>
                                    option && value && option.prd_name === value.prd_name
                                }
                            />
                        </div>
                    </Grid>
                    {/* <Grid  item xs={2} md={2} >
                        <div style={{ display: 'grid', placeItems: 'center' }}>
                            <Autocomplete
                                id="cmb_type"
                                size="small"
                                sx={{ width: 220 }}
                                options={top100Films} // กำหนดรายการตัวเลือก
                                getOptionLabel={(option) => option.title} // กำหนดฟิลด์ที่จะแสดงในตัวเลือก
                                renderInput={(params) => <TextField {...params} label="Unit Type" />} // แสดง input field
                            />
                        </div>
                    </Grid> */}
                    <Grid  item xs={2} md={2} >
                        <Button 
                            variant="contained" 
                            size="small"
                            style={{width: '100px', height: '35px' , marginTop: '2px', marginLeft: '25px'}}
                            onClick={handleSearch}
                            >Search
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </React.Fragment>
    );
}

export default SearchProd_Fc
