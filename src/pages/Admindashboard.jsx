import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { logout, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [products, setProducts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ totalSales: 0, totalCommissions: 0 });

  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  // Forms
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', roleId: '' });
  const [newRole, setNewRole] = useState({ name: '', commission: 0 });
  const [newProduct, setNewProduct] = useState({ name: '', price: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [usersSnap, rolesSnap, productsSnap, ticketsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'roles')),
      getDocs(collection(db, 'products')),
      getDocs(query(collection(db, 'tickets'), orderBy('createdAt', 'desc')))
    ]);

    const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const rolesData = rolesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const productsData = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const ticketsData = ticketsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    setUsers(usersData);
    setRoles(rolesData);
    setProducts(productsData);
    setTickets(ticketsData);

    // Calculate stats
    const totalSales = ticketsData.reduce((sum, t) => sum + t.total, 0);
    const totalCommissions = ticketsData.reduce((sum, t) => sum + t.commission, 0);
    setStats({ totalSales, totalCommissions });
  };

  const createUser = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
      const role = roles.find(r => r.id === newUser.roleId);
      
      await addDoc(collection(db, 'users'), {
        uid: userCredential.user.uid,
        name: newUser.name,
        email: newUser.email,
        role: role?.name || 'employee',
        roleId: newUser.roleId,
        commission: role?.commission || 0,
        createdAt: new Date()
      });

      setShowUserModal(false);
      setNewUser({ name: '', email: '', password: '', roleId: '' });
      loadData();
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  const createRole = async () => {
    await addDoc(collection(db, 'roles'), { ...newRole, createdAt: new Date() });
    setShowRoleModal(false);
    setNewRole({ name: '', commission: 0 });
    loadData();
  };

  const createProduct = async () => {
    await addDoc(collection(db, 'products'), { ...newProduct, createdAt: new Date() });
    setShowProductModal(false);
    setNewProduct({ name: '', price: 0 });
    loadData();
  };

  const deleteItem = async (collectionName, id) => {
    if (confirm('Confirmer la suppression ?')) {
      await deleteDoc(doc(db, collectionName, id));
      loadData();
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>THE PALACE</h1>
        <div className="header-right">
          <span className="admin-badge">ADMIN</span>
          <button onClick={logout} className="logout-btn">Déconnexion</button>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">€{stats.totalSales.toFixed(2)}</div>
          <div className="stat-label">Ventes Totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">€{stats.totalCommissions.toFixed(2)}</div>
          <div className="stat-label">Commissions Totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{tickets.length}</div>
          <div className="stat-label">Tickets</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{users.filter(u => u.role !== 'admin').length}</div>
          <div className="stat-label">Employés</div>
        </div>
      </div>

      <div className="tabs">
        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>Utilisateurs</button>
        <button className={activeTab === 'roles' ? 'active' : ''} onClick={() => setActiveTab('roles')}>Rôles</button>
        <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>Produits</button>
        <button className={activeTab === 'tickets' ? 'active' : ''} onClick={() => setActiveTab('tickets')}>Tickets</button>
      </div>

      <div className="tab-content">
        {activeTab === 'users' && (
          <div>
            <button onClick={() => setShowUserModal(true)} className="add-btn">+ Ajouter Utilisateur</button>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Commission</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td><span className="role-badge">{user.role}</span></td>
                      <td>{user.commission}%</td>
                      <td>
                        <button onClick={() => deleteItem('users', user.id)} className="delete-btn">Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <div>
            <button onClick={() => setShowRoleModal(true)} className="add-btn">+ Ajouter Rôle</button>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nom du Rôle</th>
                    <th>Commission</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map(role => (
                    <tr key={role.id}>
                      <td>{role.name}</td>
                      <td>{role.commission}%</td>
                      <td>
                        <button onClick={() => deleteItem('roles', role.id)} className="delete-btn">Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            <button onClick={() => setShowProductModal(true)} className="add-btn">+ Ajouter Produit</button>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Prix</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>€{product.price.toFixed(2)}</td>
                      <td>
                        <button onClick={() => deleteItem('products', product.id)} className="delete-btn">Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="tickets-list">
            {tickets.map(ticket => (
              <div key={ticket.id} className="ticket-card">
                <div className="ticket-header">
                  <span className="ticket-id">#{ticket.id.slice(0, 8)}</span>
                  <span className="ticket-date">{new Date(ticket.createdAt?.toDate()).toLocaleString()}</span>
                </div>
                <div className="ticket-body">
                  <div>Employé: <strong>{ticket.userName}</strong></div>
                  <div>Total: <strong>€{ticket.total.toFixed(2)}</strong></div>
                  <div>Commission: <strong>€{ticket.commission.toFixed(2)}</strong></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nouvel Utilisateur</h2>
            <input
              type="text"
              placeholder="Nom"
              value={newUser.name}
              onChange={(e) => setNewUser({...newUser, name: e.target.value})}
            />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
            />
            <select
              value={newUser.roleId}
              onChange={(e) => setNewUser({...newUser, roleId: e.target.value})}
            >
              <option value="">Sélectionner un rôle</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name} ({role.commission}%)</option>
              ))}
            </select>
            <div className="modal-actions">
              <button onClick={createUser} className="confirm-btn">Créer</button>
              <button onClick={() => setShowUserModal(false)} className="cancel-btn">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {showRoleModal && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nouveau Rôle</h2>
            <input
              type="text"
              placeholder="Nom du rôle"
              value={newRole.name}
              onChange={(e) => setNewRole({...newRole, name: e.target.value})}
            />
            <input
              type="number"
              placeholder="Commission (%)"
              value={newRole.commission}
              onChange={(e) => setNewRole({...newRole, commission: parseFloat(e.target.value)})}
            />
            <div className="modal-actions">
              <button onClick={createRole} className="confirm-btn">Créer</button>
              <button onClick={() => setShowRoleModal(false)} className="cancel-btn">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nouveau Produit</h2>
            <input
              type="text"
              placeholder="Nom du produit"
              value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Prix (€)"
              value={newProduct.price}
              onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
            />
            <div className="modal-actions">
              <button onClick={createProduct} className="confirm-btn">Créer</button>
              <button onClick={() => setShowProductModal(false)} className="cancel-btn">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}