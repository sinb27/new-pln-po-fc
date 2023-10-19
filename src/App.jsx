import "./App.css";
import { Route, Routes } from "react-router-dom";
import Planning_Forecast_POPage from "./pages/Planning_Forecast_POPage";
import Planning_Forecast_AnalysisPage from "./pages/Planning_Forecast_AnalysisPage";
import Login from "./pages/Login";
import Nav from "../src/components/Nav";
import { Fragment } from "react";
import ProtectedRoutes from "./components/auths/ProtectedRoutes";

export default function App() {
  return (
    <Fragment>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* Protect */}
        <Route element={<ProtectedRoutes />}>
          <Route path="/home" element={<Nav />} />
          <Route path="/pln_fc_po" element={<Planning_Forecast_POPage />} />
          <Route
            path="/pln_fc_analysis"
            element={<Planning_Forecast_AnalysisPage />}
          />
        </Route>
        {/* Protect */}
      </Routes>
    </Fragment>
  );
}
