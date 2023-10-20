import axios from "axios";

export default function countUsagePO() {
  //*********************************** */
  // Set System name and Menu name for function countUsagePO
  const systemName = "Smart planning";
  const menuName = "FC Analysis";

  console.log("FC Analysis counted");

  //************Date Format*********** */
  // Get today's date in yyyy-mm-dd format
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based, so we add 1
  const dd = String(date.getDate()).padStart(2, "0");

  const formattedDate = `${yyyy}-${mm}-${dd}`;

  const usageDate = formattedDate;
  console.log(usageDate); // Outputs: yyyy-mm-dd

  //***********Data from login*********** */
  // Get user_login from localStorage
  let userLoggedin;

  if (localStorage.getItem("userToken") !== null) {
    const userLocal = localStorage.getItem("userToken");
    const userLoginToken = JSON.parse(userLocal);
    userLoggedin = userLoginToken.user_login;
    console.log(userLoggedin);
  } else if (localStorage.getItem("guestToken") !== null) {
    const userLocal = localStorage.getItem("guestToken");
    const userLoginToken = JSON.parse(userLocal);
    userLoggedin = userLoginToken.user_login;
    console.log(userLoggedin);
  } else {
    console.log("user not logged in");
  }

  //**********Get Update Insert********** */
  // Check if the user exists by calling the get API
  if (userLoggedin !== null) {
    axios
      .get(
        `http://10.17.66.242:3001/api/smart_planning/filter-get-user?user_login=${userLoggedin}&system_name=${systemName}&menu_name=${menuName}&usage_date=${usageDate}`
      )
      .then((res) => {
        //**********Create condition when user is null********** */
        let getUserLogin;
        // Check if res.data has the expected structure
        if (res.data && res.data.length > 0 && res.data[0].user_login) {
          getUserLogin = res.data[0].user_login;
          console.log("user exist");
          //**********Push data from res to local********** */
          // Push data from the response to localStorage
          const getDataCount = res.data[0];
          localStorage.setItem(
            "getDataCount_FCVSPO",
            JSON.stringify(getDataCount)
          );
          console.log(getDataCount);

          //**********Get data from res to local********** */
          //Get getDataCount from localStorage
          const getDataCountLocal = localStorage.getItem("getDataCount_FCVSPO");
          const getDataCountToken = JSON.parse(getDataCountLocal);
          const getUsageCount = getDataCountToken.usage_count;
          console.log(getUsageCount);

          //**********Count += 1********** */
          // Count usage
          const counted = parseInt(getUsageCount) + 1;
          console.log(counted);

          //**********if != null -> Update data********** */
          // Update data by calling the update API
          axios
            .get(
              `http://10.17.66.242:3001/api/smart_planning/filter-save-user?check=update&user_login=${userLoggedin}&system_name=${systemName}&menu_name=${menuName}&usage_date=${usageDate}&usage_count=${counted}`
            )
            .then((res) => {
              console.log(res.data);
              console.log("update success");
            });
        } else {
          console.log("user not exist");

          //**********else = null -> Insert data********** */
          axios
            .get(
              `http://10.17.66.242:3001/api/smart_planning/filter-save-user?check=insert&user_login=${userLoggedin}&system_name=${systemName}&menu_name=${menuName}&usage_date=${usageDate}&usage_count=1`
            )
            .then((res) => {
              console.log(res.data);
              console.log("insert success");
            });
        }

        //**********Check user_login from === user_login from local********** */

        //**********For login!!!********** */

        if (getUserLogin === userLoggedin) {
          console.log("user exist");
          // Push data from the response to localStorage
          const getDataCount = res.data[0];
          localStorage.setItem(
            "getDataCount_FCVSPO",
            JSON.stringify(getDataCount)
          );
          console.log(getDataCount);

          //Get getDataCount from localStorage
          const getDataCountLocal = localStorage.getItem("getDataCount_FCVSPO");
          const getDataCountToken = JSON.parse(getDataCountLocal);
          const getUsageCount = getDataCountToken.usage_count;
          console.log(getUsageCount);

          // Count usage
          const counted = parseInt(getUsageCount) + 1;
          console.log(counted);

          // Update data by calling the update API
          if (
            getDataCountToken.user_login &&
            getDataCountToken.system_name &&
            getDataCountToken.menu_name &&
            getDataCountToken.usage_date === null
          ) {
            axios
              .get(
                `http://10.17.66.242:3001/api/smart_planning/filter-save-user?check=insert&user_login=${userLoggedin}&system_name=${systemName}&menu_name=${menuName}&usage_date=${usageDate}&usage_count=${counted}`
              )
              .then((res) => {
                console.log(res.data);
                console.log("insert success");
              });
          } else {
            axios
              .get(
                `http://10.17.66.242:3001/api/smart_planning/filter-save-user?check=update&user_login=${userLoggedin}&system_name=${systemName}&menu_name=${menuName}&usage_date=${usageDate}&usage_count=${counted}`
              )
              .then((res) => {
                console.log(res.data);
                console.log("update success");
              });
          }
        } else {
          console.log("user not match");
        }
      });
  } else {
    //**********For Guest!!!********** */

    console.log("guest user");
    // Check if the guest user exists by calling the get API
    axios
      .get(
        `http://10.17.66.242:3001/api/smart_planning/filter-get-user?user_login=guest&system_name=${systemName}&menu_name=${menuName}&usage_date=${usageDate}`
      )
      .then((res) => {
        // Get user_login from the response
        const getUserLogin = res.data[0].user_login;
        console.log(getUserLogin);

        if (getUserLogin === "guest") {
          console.log("guest user exist");
          // Push data from the response to localStorage
          const getDataCount = res.data[0];
          localStorage.setItem(
            "getDataCount_FCVSPO",
            JSON.stringify(getDataCount)
          );
          console.log(getDataCount);

          //Get getDataCount from localStorage
          const getDataCountLocal = localStorage.getItem("getDataCount_FCVSPO");
          const getDataCountToken = JSON.parse(getDataCountLocal);
          const getUsageCount = getDataCountToken.usage_count;
          console.log(getUsageCount);

          // Count usage
          const counted = parseInt(getUsageCount) + 1;
          console.log(counted);

          // Update data by calling the update API
          if (
            getDataCountToken.user_login &&
            getDataCountToken.system_name &&
            getDataCountToken.menu_name &&
            getDataCountToken.usage_date === null
          ) {
            axios
              .get(
                `http://10.17.66.242:3001/api/smart_planning/filter-save-user?check=insert&user_login=guest&system_name=${systemName}&menu_name=${menuName}&usage_date=${usageDate}&usage_count=${counted}`
              )
              .then((res) => {
                console.log(res.data);
                console.log("insert success");
              });
          } else {
            axios
              .get(
                `http://10.17.66.242:3001/api/smart_planning/filter-save-user?check=update&user_login=guest&system_name=${systemName}&menu_name=${menuName}&usage_date=${usageDate}&usage_count=${counted}`
              )
              .then((res) => {
                console.log(res.data);
                console.log("update success");
              });
          }
        } else {
          console.log("guest user not match");
        }
      });
  }

  return countUsagePO;
}
