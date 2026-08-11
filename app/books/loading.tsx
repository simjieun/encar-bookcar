export default function BooksLoading() {
  return <main className="books-page"><div className="site-container py-24"><div className="h-14 w-56 animate-pulse rounded-2xl bg-[#e9edf1]" /><div className="book-grid">{Array.from({ length: 8 }).map((_, index) => <div className="book-card-skeleton" key={index} />)}</div></div></main>;
}
