// ==================== IN-MEMORY DATA STORAGE ====================
// All data stored here will be lost when page refreshes
let users = [];
let bookings = [];
let currentUser = null;

// ==================== UTILITY FUNCTIONS ====================
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1);
    return page || 'index.html';
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
        setTimeout(() => {
            errorElement.classList.remove('show');
        }, 5000);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Save to sessionStorage (persists during browser session)
function saveToSession() {
    sessionStorage.setItem('users', JSON.stringify(users));
    sessionStorage.setItem('bookings', JSON.stringify(bookings));
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
}

// Load from sessionStorage
function loadFromSession() {
    const savedUsers = sessionStorage.getItem('users');
    const savedBookings = sessionStorage.getItem('bookings');
    const savedCurrentUser = sessionStorage.getItem('currentUser');
    
    if (savedUsers) users = JSON.parse(savedUsers);
    if (savedBookings) bookings = JSON.parse(savedBookings);
    if (savedCurrentUser) currentUser = JSON.parse(savedCurrentUser);
}

// ==================== AUTHENTICATION CHECK ====================
function checkAuth() {
    loadFromSession();
    const currentPage = getCurrentPage();
    
    if (!currentUser && currentPage !== 'index.html') {
        window.location.href = 'index.html';
    } else if (currentUser && currentPage === 'index.html') {
        window.location.href = 'home.html';
    }
}

// ==================== AUTHENTICATION (index.html) ====================
function initLoginRegisterForms() {
    const showRegisterBtn = document.getElementById('show-register');
    const showLoginBtn = document.getElementById('show-login');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (!showRegisterBtn || !showLoginBtn) return;
    
    // Toggle between login and register forms
    showRegisterBtn.addEventListener('click', () => {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        const errorElement = document.getElementById('error-message');
        if (errorElement) errorElement.classList.remove('show');
    });
    
    showLoginBtn.addEventListener('click', () => {
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        const errorElement = document.getElementById('error-message');
        if (errorElement) errorElement.classList.remove('show');
    });
    
    // Register new user
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const phone = document.getElementById('register-phone').value;
        const password = document.getElementById('register-password').value;
        
        // Validate password
        if (password.length < 6) {
            showError('Password must be at least 6 characters long');
            return;
        }
        
        // Check if email already exists
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            showError('Email already registered. Please login.');
            return;
        }
        
        // Create new user
        const newUser = {
            id: generateId(),
            name: name,
            email: email,
            phone: phone,
            password: password,
            address: '',
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        currentUser = { id: newUser.id, name: newUser.name, email: newUser.email, phone: newUser.phone };
        saveToSession();
        
        window.location.href = 'home.html';
    });
    
    // Login existing user
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        // Find user
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            showError('Invalid email or password');
            return;
        }
        
        currentUser = { id: user.id, name: user.name, email: user.email, phone: user.phone };
        saveToSession();
        window.location.href = 'home.html';
    });
}

// ==================== LOGOUT ====================
function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            currentUser = null;
            sessionStorage.clear();
            window.location.href = 'index.html';
        });
    }
}

// ==================== HOME PAGE (home.html) ====================
function initHomePage() {
    loadUserData();
    setupBookingModal();
}

function loadUserData() {
    const userNameElement = document.getElementById('user-name');
    if (userNameElement && currentUser) {
        userNameElement.textContent = currentUser.name;
    }
}

function setupBookingModal() {
    const modal = document.getElementById('booking-modal');
    const closeBtn = document.querySelector('.close');
    const bookingForm = document.getElementById('booking-form');
    const bookButtons = document.querySelectorAll('.btn-book');
    
    if (!modal) return;
    
    // Set minimum date to today
    const dateInput = document.getElementById('booking-date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    
    // Open modal when book button is clicked
    bookButtons.forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest('.service-card');
            const serviceName = card.dataset.service;
            const servicePrice = card.dataset.price;
            
            document.getElementById('service-name').value = serviceName;
            document.getElementById('service-price').value = '₹' + servicePrice;
            
            modal.style.display = 'block';
        });
    });
    
    // Close modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            bookingForm.reset();
        });
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            bookingForm.reset();
        }
    });
    
    // Handle booking submission
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            alert('Please login first');
            return;
        }
        
        const service = document.getElementById('service-name').value;
        const price = document.getElementById('service-price').value;
        const address = document.getElementById('booking-address').value;
        const date = document.getElementById('booking-date').value;
        const time = document.getElementById('booking-time').value;
        
        // Create new booking
        const newBooking = {
            id: generateId(),
            userId: currentUser.id,
            userName: currentUser.name,
            userEmail: currentUser.email,
            userPhone: currentUser.phone,
            service: service,
            price: price,
            address: address,
            date: date,
            time: time,
            status: 'Confirmed',
            createdAt: new Date().toISOString()
        };
        
        bookings.push(newBooking);
        saveToSession();
        
        alert('Booking confirmed successfully!');
        modal.style.display = 'none';
        bookingForm.reset();
        window.location.href = 'bookings.html';
    });
}

// ==================== BOOKINGS PAGE (bookings.html) ====================
let currentFilter = 'all';

function initBookingsPage() {
    loadBookings();
    setupFilterButtons();
}

function loadBookings() {
    const container = document.getElementById('bookings-container');
    if (!container) return;
    
    // Get current user's bookings
    const userBookings = bookings.filter(b => b.userId === currentUser.id);
    
    displayBookings(userBookings);
}

function displayBookings(bookingsToDisplay) {
    const container = document.getElementById('bookings-container');
    if (!container) return;
    
    if (bookingsToDisplay.length === 0) {
        container.innerHTML = '<p class="empty-message">No bookings found</p>';
        return;
    }
    
    container.innerHTML = '';
    
    bookingsToDisplay.forEach(booking => {
        const bookingElement = document.createElement('div');
        bookingElement.className = 'booking-item';
        
        bookingElement.innerHTML = `
            <h3>${booking.service}</h3>
            <p><strong>Price:</strong> ${booking.price}</p>
            <p><strong>Address:</strong> ${booking.address}</p>
            <p><strong>Date:</strong> ${formatDate(booking.date)}</p>
            <p><strong>Time:</strong> ${booking.time}</p>
            <span class="booking-status status-${booking.status}">${booking.status}</span>
            ${booking.status === 'Confirmed' ? 
                `<button class="btn-cancel" data-booking-id="${booking.id}">Cancel Booking</button>` 
                : ''}
        `;
        
        container.appendChild(bookingElement);
    });
    
    // Add event listeners to cancel buttons
    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', function() {
            cancelBooking(this.dataset.bookingId);
        });
    });
}

function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }
    
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
        booking.status = 'Cancelled';
        saveToSession();
        alert('Booking cancelled successfully');
        loadBookings();
    }
}

function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (filterButtons.length === 0) return;
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            currentFilter = this.dataset.filter;
            
            const userBookings = bookings.filter(b => b.userId === currentUser.id);
            
            if (currentFilter === 'all') {
                displayBookings(userBookings);
            } else {
                const filtered = userBookings.filter(b => b.status === currentFilter);
                displayBookings(filtered);
            }
        });
    });
}

// ==================== PROFILE PAGE (profile.html) ====================
function initProfilePage() {
    loadProfile();
    loadStats();
    loadRecentActivity();
    setupProfileForm();
}

function loadProfile() {
    const user = users.find(u => u.id === currentUser.id);
    if (!user) return;
    
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const avatarInitial = document.getElementById('avatar-initial');
    const editName = document.getElementById('edit-name');
    const editPhone = document.getElementById('edit-phone');
    const editAddress = document.getElementById('edit-address');
    
    if (profileName) profileName.textContent = user.name;
    if (profileEmail) profileEmail.textContent = user.email;
    if (avatarInitial) avatarInitial.textContent = user.name.charAt(0).toUpperCase();
    if (editName) editName.value = user.name;
    if (editPhone) editPhone.value = user.phone;
    if (editAddress) editAddress.value = user.address || '';
}

function loadStats() {
    const userBookings = bookings.filter(b => b.userId === currentUser.id);
    const totalBookings = userBookings.length;
    const completedBookings = userBookings.filter(b => b.status === 'Completed').length;
    
    const totalElement = document.getElementById('total-bookings');
    const completedElement = document.getElementById('completed-bookings');
    
    if (totalElement) totalElement.textContent = totalBookings;
    if (completedElement) completedElement.textContent = completedBookings;
}

function loadRecentActivity() {
    const activityContainer = document.getElementById('recent-activity');
    if (!activityContainer) return;
    
    const userBookings = bookings
        .filter(b => b.userId === currentUser.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    
    if (userBookings.length === 0) {
        activityContainer.innerHTML = '<p class="empty-message">No recent activity</p>';
        return;
    }
    
    activityContainer.innerHTML = '';
    
    userBookings.forEach(booking => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const createdDate = new Date(booking.createdAt).toLocaleDateString();
        
        activityItem.innerHTML = `
            <p><strong>${booking.service}</strong> - ${booking.status}</p>
            <p>Scheduled for: ${booking.date} at ${booking.time}</p>
            <p class="activity-date">Booked on: ${createdDate}</p>
        `;
        
        activityContainer.appendChild(activityItem);
    });
}

function setupProfileForm() {
    const profileForm = document.getElementById('profile-form');
    if (!profileForm) return;
    
    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('edit-name').value;
        const phone = document.getElementById('edit-phone').value;
        const address = document.getElementById('edit-address').value;
        
        const user = users.find(u => u.id === currentUser.id);
        if (user) {
            user.name = name;
            user.phone = phone;
            user.address = address;
            
            // Update current user session
            currentUser.name = name;
            currentUser.phone = phone;
            
            saveToSession();
            alert('Profile updated successfully!');
            loadProfile();
        }
    });
}
function initProfilePictureURL() {
    const urlInput = document.getElementById('profile-picture-url');
    const updateBtn = document.getElementById('update-picture-url');
    
    if (urlInput && updateBtn) {
        updateBtn.addEventListener('click', function() {
            const url = urlInput.value.trim();
            if (url) {
                displayProfilePicture(url);
                saveProfilePicture(url);
            } else {
                showError('Please enter a valid image URL');
            }
        });
    }
}

// ==================== INITIALIZE APPLICATION ====================
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    const currentPage = getCurrentPage();
    
    if (currentPage === 'index.html') {
        initLoginRegisterForms();
    } else if (currentPage === 'home.html') {
        initHomePage();
        setupLogout();
    } else if (currentPage === 'bookings.html') {
        initBookingsPage();
        setupLogout();
    } else if (currentPage === 'profile.html') {
        initProfilePage();
        setupLogout();
    }
});