import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import Home from './pages/Home';
import ListingDetail from './pages/ListingDetail';
import Auctions from './pages/Auctions';
import AuctionDetail from './pages/AuctionDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Sell from './pages/Sell';
import MyListings from './pages/MyListings';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import WalletPage from './pages/Wallet';
import Moderation from './pages/Moderation';
import NotFound from './pages/NotFound';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="listing/:id" element={<ListingDetail />} />
        <Route path="auctions" element={<Auctions />} />
        <Route path="auctions/:id" element={<AuctionDetail />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="sell" element={<Sell />} />
          <Route path="my-listings" element={<MyListings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="cart" element={<Cart />} />
          <Route path="orders" element={<Orders />} />
          <Route path="wallet" element={<WalletPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={['moderator', 'admin']} />}>
          <Route path="moderation" element={<Moderation />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
