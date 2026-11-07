import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api, { getMediaUrl } from "../lib/api";
import { formatMoney } from "../lib/money";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
  createdAt?: string;
  seller?: { name: string };
}

type SortOrder = "newest" | "price-low" | "price-high" | "name";

function Marketplace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/api/products");
        setProducts(res.data);
      } catch (fetchError) {
        console.error("Failed to load products", fetchError);
        setError("We couldn’t load the shop right now. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    void fetchProducts();
  }, []);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesSearch = !query || [product.name, product.description, product.seller?.name ?? ""]
        .some((value) => value.toLowerCase().includes(query));
      return matchesSearch && (!inStockOnly || product.stock > 0);
    });

    return filtered.sort((a, b) => {
      if (sortOrder === "price-low") return a.price - b.price;
      if (sortOrder === "price-high") return b.price - a.price;
      if (sortOrder === "name") return a.name.localeCompare(b.name);
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });
  }, [products, search, sortOrder, inStockOnly]);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">The TRIGGER marketplace</p>
          <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Find something good.</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">Browse products from independent sellers across Ghana.</p>
            </div>
            <p className="text-sm font-medium text-slate-500" aria-live="polite">
              {loading ? "Loading products…" : `${visibleProducts.length} ${visibleProducts.length === 1 ? "product" : "products"}`}
            </p>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-center">
            <label className="relative block">
              <span className="sr-only">Search products</span>
              <svg className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <circle cx="11" cy="11" r="7" strokeWidth="1.8" />
                <path d="m16 16 4 4" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products or sellers"
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <label className="relative">
              <span className="sr-only">Sort products</span>
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as SortOrder)}
                className="min-h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="newest">Sort: Newest</option>
                <option value="price-low">Price: Low to high</option>
                <option value="price-high">Price: High to low</option>
                <option value="name">Name: A to Z</option>
              </select>
              <svg className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.22 7.47a.75.75 0 0 1 1.06 0L10 11.19l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </label>
            <label className="inline-flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(event) => setInStockOnly(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              In stock only
            </label>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8" aria-label="Products">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
            <p className="font-semibold text-slate-900">The shop is temporarily unavailable</p>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">Try again</button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="aspect-[4/3] animate-pulse bg-slate-100" />
                <div className="space-y-3 p-4"><div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" /><div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" /><div className="h-10 animate-pulse rounded-lg bg-slate-100" /></div>
              </div>
            ))}
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700" aria-hidden="true">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7" strokeWidth="1.7" /><path d="m16 16 4 4" strokeWidth="1.7" strokeLinecap="round" /></svg>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">No products match that search</h2>
            <p className="mt-2 text-sm text-slate-600">Try another name or turn off the in-stock filter.</p>
            <button type="button" onClick={() => { setSearch(""); setInStockOnly(false); }} className="mt-5 text-sm font-semibold text-blue-700 hover:text-blue-900">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleProducts.map((product) => (
              <article key={product._id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <Link to={`/product/${product._id}`} className="block focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-600">
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    {product.image ? (
                      <img src={getMediaUrl(product.image)} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <div className="text-center"><span className="text-3xl" aria-hidden="true">◇</span><p className="mt-1 text-xs">Product image</p></div>
                      </div>
                    )}
                    <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${product.stock > 0 ? "bg-white/95 text-emerald-800" : "bg-slate-900/85 text-white"}`}>
                      {product.stock > 0 ? "In stock" : "Sold out"}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-medium text-slate-500">{product.seller?.name ? `From ${product.seller.name}` : "Ghanaian seller"}</p>
                    <h2 className="mt-1.5 line-clamp-1 text-base font-semibold text-slate-900 group-hover:text-blue-800">{product.name}</h2>
                    <p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{product.description}</p>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <p className="text-lg font-bold tracking-tight text-slate-950">{formatMoney(product.price)}</p>
                      <span className="text-xs text-slate-500">{product.stock > 0 ? `${product.stock} available` : "Unavailable"}</span>
                    </div>
                  </div>
                </Link>
                <div className="px-4 pb-4">
                  <Link to={`/product/${product._id}`} className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
                    View product <span aria-hidden="true" className="ml-2">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Marketplace;
