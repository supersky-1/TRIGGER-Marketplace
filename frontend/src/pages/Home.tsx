import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { user } = useAuth();
  const sellerHref = user?.role === "seller" ? "/seller/verification" : "/register";

  return (
    <div className="bg-white">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_rgba(79,70,229,0.5),_transparent_48%),radial-gradient(ellipse_at_bottom_left,_rgba(37,99,235,0.32),_transparent_45%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-blue-100">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              GHANA’S ONLINE MARKETPLACE
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Good finds.
              <span className="block text-blue-300">Local sellers.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Discover products from independent Ghanaian businesses, pay securely with Mobile Money, and follow your order from checkout to delivery.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/marketplace"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
              >
                Explore the shop <span aria-hidden="true" className="ml-2">→</span>
              </Link>
              {!user && (
                <Link
                  to={sellerHref}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Start selling
                </Link>
              )}
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2"><span className="text-emerald-300">✓</span> Verified sellers</span>
              <span className="inline-flex items-center gap-2"><span className="text-emerald-300">✓</span> Mobile Money checkout</span>
              <span className="inline-flex items-center gap-2"><span className="text-emerald-300">✓</span> Order tracking</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:ml-auto">
            <div className="absolute -inset-4 rounded-[2rem] bg-blue-500/20 blur-2xl" />
            <div className="relative rounded-[1.75rem] border border-white/10 bg-white/[0.08] p-5 shadow-2xl backdrop-blur sm:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">A smoother way to shop</p>
                  <h2 className="mt-2 text-xl font-semibold">From local shop to your door</h2>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-400/15 text-xl text-blue-200" aria-hidden="true">✦</div>
              </div>
              <div className="mt-6 space-y-5">
                {[
                  ["01", "Find something you love", "Browse products from independent sellers."],
                  ["02", "Approve your MoMo payment", "Confirm the payment request on your phone."],
                  ["03", "Keep up with your order", "See order updates from your account."],
                ].map(([number, title, detail]) => (
                  <div key={number} className="flex gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-300/30 bg-blue-400/10 text-xs font-bold text-blue-200">{number}</div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{title}</h3>
                      <p className="mt-1 text-sm leading-5 text-slate-300">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/marketplace" className="mt-7 flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-medium text-slate-100 hover:bg-slate-950/65">
                Browse available products <span aria-hidden="true" className="text-blue-300">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Made for local commerce</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">A better experience on both sides of the sale.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">Simple tools bring buyers and independent businesses together in one place.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { number: "01", title: "Shop with confidence", body: "See seller information, product details, stock, and your order status in one place." },
              { number: "02", title: "Pay on your phone", body: "Use Mobile Money at checkout and authorize payment directly on your device." },
              { number: "03", title: "Grow a business", body: "Manage product listings, orders, and payout requests from a seller dashboard." },
            ].map((feature) => (
              <article key={feature.number} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-7">
                <span className="text-xs font-bold tracking-[0.15em] text-blue-700">{feature.number}</span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Ready to find your next favourite?</h2>
            <p className="mt-2 text-sm text-slate-600">Explore what Ghanaian sellers have listed today.</p>
          </div>
          <Link to="/marketplace" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
            Browse products <span aria-hidden="true" className="ml-2">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
