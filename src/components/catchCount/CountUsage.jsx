// import axios from "axios";

// const getAPI =
//   "http://10.17.66.242:3001/api/smart_planning/filter-get-user?user_login=Anupab&system_name=Smart%20planning&menu_name=FC%20VS%20PO&usage_date=2023-10-18";
// const insertAPI =
//   "http://10.17.66.242:3001/api/smart_planning/filter-save-user?check=insert&user_login=Anupab&system_name=Smart%20planning&menu_name=FC%20VS%20PO&usage_date=2023-10-19&usage_count=1";
// const updateAPI = insertAPI; // This seems to be the same API, just with different parameters

// export default function countUsage() {
//   const user_login = localStorage.getItem("user_login") || "Anupab";
//   const system_name = "Smart planning";
//   const menu_name = "FC VS PO";
//   const usage_date = new Date().toISOString().split("T")[0];

//   // Check if the user exists
//   axios
//     .get(getAPI, {
//       params: {
//         user_login: user_login,
//         system_name: system_name,
//         menu_name: menu_name,
//         usage_date: usage_date,
//       },

//     })
//     .then((res) => {
//       if (res.data && res.data.length > 0) {
//         // User exists, update the count
//         axios
//           .post(updateAPI, {
//             check: "update",
//             user_login: user_login,
//             system_name: system_name,
//             menu_name: menu_name,
//             usage_date: usage_date,
//             usage_count: res.data[0].usage_count + 1, // Assuming you receive usage_count in the response
//           })
//           .then((updateRes) => console.log(updateRes.data))
//           .catch((err) => console.log(err));
//       } else {
//         // User doesn't exist, insert new data
//         axios
//           .post(insertAPI, {
//             check: "insert",
//             user_login: user_login,
//             system_name: system_name,
//             menu_name: menu_name,
//             usage_date: usage_date,
//             usage_count: 1,
//           })
//           .then((insertRes) => console.log(insertRes.data))
//           .catch((err) => console.log(err));
//       }
//     })
//     .catch((err) => console.log(err));

// }

import axios from "axios";

export default function countUsage() {
  console.log("counted");

  // Get today's date in yyyy-mm-dd format
  const date = new Date();

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based, so we add 1
  const dd = String(date.getDate()).padStart(2, "0");

  const formattedDate = `${yyyy}-${mm}-${dd}`;

  const usage_date = formattedDate;
  console.log(usage_date); // Outputs: yyyy-mm-dd

  // Check if the user exists by calling the get API

  axios
    .get(
      "http://10.17.66.242:3001/api/smart_planning/filter-get-user?user_login=Anupab&system_name=Smart%20planning&menu_name=FC%20VS%20PO&usage_date=2023-10-18"
    )
    .then((res) => {
      const checkUser = res.data;
      console.log(checkUser);
      return checkUser;
    });

  // Update data by calling the update API

  axios
    .get(
      `http://10.17.66.242:3001/api/smart_planning/filter-save-user?check=update&user_login=${user_login}&system_name=${system_name}&menu_name=${menu_name}&usage_date=$${usage_date}&usage_count=${usage_count}`
    )
    .then((res) => {
      console.log(res.data);
    });

  return countUsage;
}
