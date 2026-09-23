import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// --- REPLACE THESE WITH YOUR SUPABASE DETAILS ---
const SUPABASE_URL = 'https://sfwehcdkrpvhiiufdjtt.supabase.co/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmd2VoY2RrcnB2aGlpdWZkanR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMzUwMzksImV4cCI6MjEwNTcxMTAzOX0.qvvavCFVPEqqtvLwppUDFaSRSGztKYBxScqrxjEfYjw';
// ------------------------------------------------

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const bookGrid = document.getElementById('bookGrid');
const loadingText = document.getElementById('loading');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// Fetch books from Supabase
async function fetchBooks(searchQuery = '') {
  loadingText.style.display = 'block';
  bookGrid.innerHTML = '';

  let query = supabase.from('books').select('*').order('id', { ascending: true });

  if (searchQuery) {
    query = query.ilike('title', `%${searchQuery}%`);
  }

  const { data: books, error } = await query;
  loadingText.style.display = 'none';

  if (error) {
    console.error('Error fetching books:', error);
    bookGrid.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
    return;
  }

  if (books.length === 0) {
    bookGrid.innerHTML = `<p>No books found.</p>`;
    return;
  }

  renderBooks(books);
}

// Render books to the DOM
function renderBooks(books) {
  books.forEach(book => {
    const card = document.createElement('div');
    card.className = 'book-card';
    
    const coverUrl = book.cover_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300';
    
    // Determine button text, color, and badge based on status
    const isBorrowed = book.is_borrowed;
    const badgeHtml = isBorrowed 
      ? `<span class="status-badge badge-borrowed">Borrowed</span>`
      : `<span class="status-badge badge-available">Available</span>`;
      
    const buttonHtml = isBorrowed
      ? `<button class="action-btn btn-return" data-id="${book.id}" data-borrowed="true">Return Book</button>`
      : `<button class="action-btn btn-borrow" data-id="${book.id}" data-borrowed="false">Borrow Book</button>`;

    card.innerHTML = `
      ${badgeHtml}
      <img src="${coverUrl}" alt="${book.title}" class="book-cover">
      <div class="book-info">
        <h3 class="book-title">${book.title}</h3>
        <p class="book-author">${book.author}</p>
        ${buttonHtml}
      </div>
    `;
    
    bookGrid.appendChild(card);
  });
}

// Handle Borrow / Return Clicks using Event Delegation
bookGrid.addEventListener('click', async (e) => {
  if (e.target.classList.contains('action-btn')) {
    const button = e.target;
    const bookId = button.dataset.id;
    const isCurrentlyBorrowed = button.dataset.borrowed === 'true';

    // Show loading state on the button
    button.innerText = 'Updating...';
    button.disabled = true;

    // Update database (flip the boolean)
    const { error } = await supabase
      .from('books')
      .update({ is_borrowed: !isCurrentlyBorrowed })
      .eq('id', bookId);

    if (error) {
      console.error('Error updating status:', error);
      alert('Failed to update book status. See console for details.');
      button.disabled = false;
      button.innerText = isCurrentlyBorrowed ? 'Return Book' : 'Borrow Book';
    } else {
      // Refresh the book list to show new status
      fetchBooks(searchInput.value);
    }
  }
});

// Search functionality
searchBtn.addEventListener('click', () => fetchBooks(searchInput.value));
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') fetchBooks(searchInput.value);
});

// Initialize app
fetchBooks();