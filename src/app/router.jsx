import React from 'react';
import {Routes,Route,Navigate,Link} from 'react-router-dom';
import EmployeeLayout from '../layouts/EmployeeLayout';
import PublicLayout from '../layouts/PublicLayout';
import RequireEmployee from '../modules/auth/RequireEmployee';
import LoginPage from '../modules/auth/LoginPage';
import AccountPage from '../modules/auth/AccountPage';
import DashboardPage from '../modules/dashboard/DashboardPage';
import SalonPage from '../modules/salon/SalonPage';
import CocinaPage from '../modules/cocina/CocinaPage';
import CajaPage from '../modules/caja/CajaPage';
import ReservasPage from '../modules/reservas/ReservasPage';
import MenuPage from '../modules/menu/MenuPage';
import PersonalPage from '../modules/personal/PersonalPage';
import ReportesPage from '../modules/reportes/ReportesPage';
export default function Router(){return <Routes><Route element={<PublicLayout/>}><Route path="/login" element={<LoginPage/>}/></Route><Route path="/" element={<Navigate to="/personal/inicio" replace/>}/><Route element={<RequireEmployee/>}><Route path="/personal" element={<EmployeeLayout/>}><Route index element={<Navigate to="inicio" replace/>}/><Route path="inicio" element={<DashboardPage/>}/><Route path="mi-cuenta" element={<AccountPage/>}/><Route element={<RequireEmployee roles={['gerente','mesero']}/>}><Route path="salon" element={<SalonPage/>}/><Route path="reservas" element={<ReservasPage/>}/></Route><Route element={<RequireEmployee roles={['gerente','cocinero']}/>}><Route path="cocina" element={<CocinaPage/>}/></Route><Route element={<RequireEmployee roles={['gerente','cajero']}/>}><Route path="caja" element={<CajaPage/>}/></Route><Route element={<RequireEmployee roles={['gerente']}/>}><Route path="menu" element={<MenuPage/>}/><Route path="empleados" element={<PersonalPage/>}/><Route path="reportes" element={<ReportesPage/>}/></Route><Route path="*" element={<section className="panel"><h1>Página no encontrada</h1><Link to="/personal/inicio">Volver al inicio</Link></section>}/></Route></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes>;}
