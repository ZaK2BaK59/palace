import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './EmployeeDashboard.css';

export default function EmployeeDashboard() {
  const { logout, currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [userData, setUserData] = useState(null);
  const [totalCommission, setTotalCommission] = useState(0);
  const [expandedTicket, setExpandedTicket] = useState(null);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    const productsSnap = await getDocs(collection(db, 'products'));
    const productsData = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setProducts(productsData);

    const usersSnap = await getDocs(collection(db, 'users'));
    const user = usersSnap.docs.find(doc => doc.data().uid === currentUser.uid);
    if (user) {
      setUserData({ id: user.id, ...user.data() });
    }

    const ticketsQuery = query(
      collection(db, 'tickets'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const ticketsSnap = await getDocs(ticketsQuery);
    const ticketsData = ticketsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setTickets(ticketsData);

    const total = ticketsData.reduce((sum, t) => sum + t.commission, 0);
    setTotalCommission(total);
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      ));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateCommission = () => {
    const total = calculateTotal();
    return total * (userData?.commission || 0) / 100;
  };

  const validateTicket = async () => {
    if (cart.length === 0) {
      alert('Le panier est vide');
      return;
    }

    const total = calculateTotal();
    const commission = calculateCommission();

    await addDoc(collection(db, 'tickets'), {
      userId: currentUser.uid,
      userName: userData?.name || 'Unknown',
      userEmail: userData?.email || '',
      items: cart,
      total,
      commission,
      commissionRate: userData?.commission || 0,
      createdAt: new Date()
    });

    setCart([]);
    loadData();
  };

  const deleteTicket = async (ticketId) => {
    if (confirm('Supprimer ce ticket ?')) {
      await deleteDoc(doc(db, 'tickets', ticketId));
      loadData();
    }
  };

  return (
    <div className="employee-dashboard">
      <header className="dashboard-header">
        <h1>THE PALACE</h1>
        <div className="header-right">
          <div className="user-info">
            <span className="user-name">{userData?.name}</span>
            <span className="user-role">{userData?.role}</span>
          </div>
          <button onClick={logout} className="logout-btn">Déconnexion</button>
        </div>
      </header>

      <div className="commission-banner">
        <div className="commission-info">
          <span className="commission-label">Ma Commission Totale</span>
          <span className="commission-value">€{totalCommission.toFixed(2)}</span>
        </div>
        <div className="commission-rate">Taux: {userData?.commission || 0}%</div>
      </div>

      <div className="pos-container">
        <div className="products-section">
          <h2>Produits</h2>
          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-card" onClick={() => addToCart(product)}>
                <div className="product-name">{product.name}</div>
                <div className="product-price">€{product.price.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="cart-section">
          <h2>Panier</h2>
          <div className="cart-items">
            {cart.length === 0 ? (
              <p className="empty-cart">Panier vide</p>
            ) : (
              cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-price">€{item.price.toFixed(2)}</span>
                  </div>
                  <div className="item-controls">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                    <span className="quantity">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    <button onClick={() => removeFromCart(item.id)} className="remove-btn">×</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <span>Total</span>
              <span className="total-amount">€{calculateTotal().toFixed(2)}</span>
            </div>
            <div className="summary-row commission-row">
              <span>Ma Prime</span>
              <span className="commission-amount">€{calculateCommission().toFixed(2)}</span>
            </div>
          </div>

          <button 
            onClick={validateTicket} 
            disabled={cart.length === 0}
            className="validate-btn"
          >
            Valider le Ticket
          </button>
        </div>
      </div>

      <div className="tickets-history">
        <h2>Historique des Tickets</h2>
        <div className="tickets-list">
          {tickets.map(ticket => (
            <div key={ticket.id} className="ticket-item">
              <div className="ticket-summary" onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}>
                <div className="ticket-info">
                  <span className="ticket-date">
                    {new Date(ticket.createdAt?.toDate()).toLocaleString()}
                  </span>
                  <span className="ticket-total">€{ticket.total.toFixed(2)}</span>
                  <span className="ticket-commission">Prime: €{ticket.commission.toFixed(2)}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteTicket(ticket.id); }} className="delete-ticket-btn">
                  Supprimer
                </button>
              </div>

              {expandedTicket === ticket.id && (
                <div className="ticket-details">
                  {ticket.items.map((item, idx) => (
                    <div key={idx} className="ticket-detail-item">
                      <span>{item.name} x{item.quantity}</span>
                      <span>€{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}