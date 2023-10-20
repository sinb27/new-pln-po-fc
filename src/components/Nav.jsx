import * as React from "react"; // นำเข้าโมดูลทั้งหมดที่ต้องการจาก React, ให้เราสามารถใช้งานฟีเจอร์ต่างๆ ของ React
import { styled, useTheme } from "@mui/material/styles"; // นำเข้าโมดูล "styled" และ "useTheme" จาก "@mui/material/styles" สำหรับการใช้งาน Styled Components และเข้าถึง Theme จาก Material-UI
import Box from "@mui/material/Box"; // นำเข้า Box จาก "@mui/material/Box" ซึ่งเป็นคอมโพเนนต์ที่ให้ความสะดวกในการจัดการ layout และ spacing
import MuiDrawer from "@mui/material/Drawer"; // นำเข้า Drawer จาก "@mui/material/Drawer" ซึ่งเป็นคอมโพเนนต์ที่เปิดเมนูแบบเลื่อนได้จากข้าง
import MuiAppBar from "@mui/material/AppBar"; // นำเข้า AppBar จาก "@mui/material/AppBar" ซึ่งเป็นคอมโพเนนต์สำหรับส่วนหัวของหน้าเว็บ
// ต่อไปนี้เป็นการนำเข้าคอมโพเนนต์ต่างๆ จาก "@mui/material" และ "@mui/icons-material" สำหรับการสร้าง UI และแสดงไอคอน
import Toolbar from "@mui/material/Toolbar";
// import List from "@mui/material/List";
// import CssBaseline from "@mui/material/CssBaseline";
// import Container from "@mui/material";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Fuji from "/Fuji.png"; // นำเข้าคอมโพเนนต์ Page1 จากไฟล์ "Page1.js" ในโฟลเดอร์เดียวกัน
import MenuList from "./MenuList";
import { Button } from "@mui/material";
import { Link } from "react-router-dom";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
// import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
// import Nav from "../components/Nav";
// import AnalyticEcommerce from "./components/cards/statistics/AnalyticEcommerce";DataChartPage

const drawerWidth = 240; // กำหนดค่าความกว้างของ Drawer เป็น 240

// สร้าง mixin สำหรับสไตล์ของ Drawer เมื่อถูกเปิด
const openedMixin = (theme) => ({
  // กำหนดความกว้างของ Drawer ให้เท่ากับ drawerWidth ที่กำหนดไว้
  width: drawerWidth,

  // กำหนด transition ของความกว้างของ Drawer เมื่อมันถูกเปิด
  // โดยใช้ฟังก์ชันสร้าง transition ของ theme ที่ได้รับจาก Material-UI
  // และกำหนดค่า easing และ duration ตามที่กำหนดใน theme
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),

  // กำหนด overflowX เป็น "hidden" เพื่อป้องกันการเลื่อนแนวนอน
  // ที่อาจเกิดขึ้นเมื่อความกว้างของ Drawer มากกว่า viewport
  overflowX: "hidden",
});

// สร้าง mixin สำหรับสไตล์ของ Drawer เมื่อถูกปิด
const closedMixin = (theme) => ({
  // ฟังก์ชันที่รับ theme และคืนค่าสไตล์เมื่อ Drawer ปิด
  // กำหนด transition ของความกว้างของ Drawer เมื่อมันถูกปิด
  // โดยใช้ฟังก์ชันสร้าง transition ของ theme ที่ได้รับจาก Material-UI
  // และกำหนดค่า easing และ duration ตามที่กำหนดใน theme
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  // กำหนด overflowX เป็น "hidden" เพื่อป้องกันการเลื่อนแนวนอน
  // ที่อาจเกิดขึ้นเมื่อความกว้างของ Drawer น้อยกว่า viewport
  overflowX: "hidden",
  // กำหนดความกว้างของ Drawer ให้เท่ากับ 7 หน่วยของ theme spacing + 1px
  width: `calc(${theme.spacing(7)} + 1px)`,
  // กำหนดความกว้างของ Drawer ให้เท่ากับ 8 หน่วยของ theme spacing + 1px เมื่อขนาดหน้าจอมากกว่าหรือเท่ากับ sm
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

// สร้างคอมโพเนนต์ styled ชื่อ DrawerHeader
const DrawerHeader = styled("div")(({ theme }) => ({
  // กำหนดให้ DrawerHeader เป็น flex container ที่จัดเรียง item แบบแนวนอน
  display: "flex",
  // กำหนดให้ item ใน DrawerHeader มีการจัดให้อยู่ตรงกลางแนวตั้ง
  alignItems: "center",
  // กำหนดให้ item ใน DrawerHeader มีการจัดให้อยู่ทางด้านขวาแนวนอน
  justifyContent: "flex-end",
  // กำหนด padding ของ DrawerHeader ด้วยฟังก์ชัน spacing ของ theme
  padding: theme.spacing(0, 1),
  // ใช้ mixin toolbar ของ theme เพื่อกำหนดสไตล์ของ DrawerHeader ให้เหมือนกับ toolbar ทั่วไป
  ...theme.mixins.toolbar,
}));

// สร้างคอมโพเนนต์เพื่อ AppBar
const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  // สร้างคอมโพเนนต์ styled ชื่อ AppBar ที่มี props เป็น open สำหรับการกำหนดสถานะเปิดปิดของ Drawer
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme),
  }),
}));

// const Home = () => (
//   <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
//     <DrawerHeader />
//     <Typography paragraph>
//       {/* Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Rhoncus dolor purus non enim praesent elementum facilisis leo vel. Risus at ultrices mi tempus imperdiet. Semper risus in hendrerit gravida rutrum quisque non tellus. Convallis convallis tellus id interdum velit laoreet id donec ultrices. Odio morbi quis commodo odio aenean sed adipiscing. Amet nisl suscipit adipiscing bibendum est ultricies integer quis. Cursus euismod quis viverra nibh cras. Metus vulputate eu scelerisque felis imperdiet proin fermentum leo. Mauris commodo quis imperdiet massa tincidunt. Cras tincidunt lobortis feugiat vivamus at augue. At augue eget arcu dictum varius duis at consectetur lorem. Velit sed ullamcorper morbi tincidunt. Lorem donec massa sapien faucibus et molestie ac. */}
//     </Typography>
//     <Typography paragraph>
//       {/* Consequat mauris nunc congue nisi vitae suscipit. Fringilla est ullamcorper eget nulla facilisi etiam dignissim diam. Pulvinar elementum integer enim neque volutpat ac tincidunt. Ornare suspendisse sed nisi lacus sed viverra tellus. Purus sit amet volutpat consequat mauris. Elementum eu facilisis sed odio morbi. Euismod lacinia at quis risus sed vulputate odio. Morbi tincidunt ornare massa eget egestas purus viverra accumsan in. In hendrerit gravida rutrum quisque non tellus orci ac. Pellentesque nec nam aliquam sem et tortor. Habitant morbi tristique senectus et. Adipiscing elit duis tristique sollicitudin nibh sit. Ornare aenean euismod elementum nisi quis eleifend. Commodo viverra maecenas accumsan lacus vel facilisis. Nulla posuere sollicitudin aliquam ultrices sagittis orci a. */}
//     </Typography>
//   </Box>
// );

// const ComputerSERecover = () => (
//   <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
//     <DrawerHeader />
//     <Typography>Computer SE Recover Component</Typography>
//   </Box>
// );

export default function Nav() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to log out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, log out!",
    }).then((result) => {
      if (result.isConfirmed) {
        // Perform the logout action here, e.g., clearing authentication tokens, redirecting to a login page, etc.
        Swal.fire("Logged out!", "You have been logged out.", "success");
        navigate("/login");
        console.log("User logged out");
        localStorage.removeItem("user");
        localStorage.clear();
      }
    });
  };

  //bind value user from localstorage
  const userString = localStorage.getItem("userToken");
  const userObject = JSON.parse(userString);
  const userName = userObject?.user_name;
  const userSurname = userObject?.user_surname;

  const userGuest = localStorage.getItem("guestToken");
  const userGuestObject = JSON.parse(userGuest);
  const userGuestRole = userGuestObject?.user_role;

  return (
    <>
      <Box sx={{ display: "flex" }}>
        {/* <CssBaseline /> */}

        {/* HEADER MUI APPBAR */}

        <AppBar position="fixed" open={open}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              edge="start"
              sx={{
                marginRight: 5,
                ...(open && { display: "none" }),
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: "bold",
              }}
            >
              Smart Planning Development
            </Typography>

            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ flexGrow: 1 }}
            />
            <Avatar
              sx={{ m: 1 }}
              alt={userName ? `${userName}` : ""}
              src="/broken-image.jpg"
            />
            <Typography variant="p" sx={{ mr: 2, fontWeight: "Bold" }}>
              User :{" "}
              {userName && userSurname
                ? `${userName} ${userSurname}`
                : userGuestRole}
            </Typography>

            <Button variant="contained" color="error" onClick={handleLogout}>
              Logout <LockOutlinedIcon sx={{ ml: 1 }} />
            </Button>
          </Toolbar>
        </AppBar>
        <Drawer variant="permanent" open={open}>
          <DrawerHeader>
            <Link to="/home">
              <img
                src={Fuji}
                alt="คำอธิบายภาพ"
                style={{
                  width: 180, // กำหนดความกว้างของภาพให้เต็มขนาดของพื้นที่ที่รองรับ
                  height: 45, // กำหนดความสูงของภาพให้ปรับแต่งตามอัตราส่วนต้นฉบับ
                }}
              />
            </Link>
            <IconButton onClick={handleDrawerClose}>
              {theme.direction === "rtl" ? (
                <ChevronRightIcon />
              ) : (
                <ChevronLeftIcon />
              )}
            </IconButton>
          </DrawerHeader>
          <Divider />
          <Divider />
          <MenuList open={open} /> {/* Pass the `open` prop to MenuList */}
        </Drawer>
      </Box>
    </>
  );
}
