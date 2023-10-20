import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Link } from "react-router-dom";
// import InboxIcon from "@mui/icons-material/Inbox";
// import MailIcon from "@mui/icons-material/Mail";
// import HomeIcon from "@mui/icons-material/Home";
// import AutoAwesomeMotionTwoToneIcon from "@mui/icons-material/AutoAwesomeMotionTwoTone";
// import FileDownloadIcon from "@mui/icons-material/FileDownload";
// import ManageSearchTwoToneIcon from "@mui/icons-material/ManageSearchTwoTone";
// import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
// import ViewCompactSharpIcon from "@mui/icons-material/ViewCompactSharp";
import WaterfallChartRoundedIcon from "@mui/icons-material/WaterfallChartRounded";
import StackedLineChartOutlinedIcon from "@mui/icons-material/StackedLineChartOutlined";
// count usage function
import countUsageAnalysis from "./catchCount/CountUsageAnalysis.jsx";

const MenuList = () => {
  return (
    <List>
      {/* <ListItem disablePadding sx={{ display: 'block',color: 'black' }} component={Link} to="/">
            <ListItemButton
                sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    
                }}
                >
                <ListItemIcon
                    sx={{
                        minWidth: 0,
                        mr: open ? 3 : 'auto',
                        justifyContent: 'center',
                        color: 'inherit', // Set initial color
                                "&:hover": {
                                color: 'primary.main', // Change color on hover
                                }
                    }}
                    >
                    <HomeIcon />
                </ListItemIcon>
                <ListItemText primary="Home" sx={{ opacity: open ? 1 : 0 }} />
            </ListItemButton>
        </ListItem> */}
      <ListItem
        disablePadding
        sx={{ display: "block", color: "black" }}
        component={Link}
        to="/pln_fc_po"
      >
        <ListItemButton
          sx={{
            minHeight: 48,
            justifyContent: open ? "initial" : "center",
            px: 2.5,
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: open ? 3 : "auto",
              justifyContent: "center",
              color: "inherit", // Set initial color
              "&:hover": {
                color: "primary.main", // Change color on hover
              },
            }}
          >
            <WaterfallChartRoundedIcon />
          </ListItemIcon>
          <ListItemText
            primary="Forecast Vs PO"
            sx={{ opacity: open ? 1 : 0 }}
          />
        </ListItemButton>
      </ListItem>
      <ListItem
        // set onclick to send count data to the server
        onClick={countUsageAnalysis}
        disablePadding
        sx={{ display: "block", color: "black" }}
        component={Link}
        to="/pln_fc_analysis"
      >
        <ListItemButton
          sx={{
            minHeight: 48,
            justifyContent: open ? "initial" : "center",
            px: 2.5,
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: open ? 3 : "auto",
              justifyContent: "center",
              color: "inherit", // Set initial color
              "&:hover": {
                color: "primary.main", // Change color on hover
              },
            }}
          >
            <StackedLineChartOutlinedIcon />
          </ListItemIcon>
          <ListItemText
            primary="Forecast Analysis"
            sx={{ opacity: open ? 1 : 0 }}
          />
        </ListItemButton>
      </ListItem>
    </List>
  );
};

export default MenuList;
