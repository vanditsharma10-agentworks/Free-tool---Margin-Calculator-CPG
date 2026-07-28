import Calculator from "@/components/Calculator";

export default function Home() {
  return (
    <main className="wrap">
      <h1>Retail Price &amp; Margin Calculator</h1>
      <p className="sub">
        Work out what your product needs to sell for on the shelf — after the distributor and
        the store each take their cut. Built for CPG (food, beverage &amp; consumer brands).
      </p>

      <div className="howto">
        <h2>How to use it — 3 steps</h2>
        <ol>
          <li>
            <strong>Pick a starting point.</strong> Start from <em>your cost</em> to find the shelf
            price, or start from a <em>shelf price</em> you have in mind to check if you can afford it.
          </li>
          <li>
            <strong>Enter your cost</strong> per unit, then choose <em>where</em> you sell and{" "}
            <em>how</em> it reaches the store. We pre-fill the typical distributor and store cuts —
            you can adjust them.
          </li>
          <li>
            <strong>Read the breakdown.</strong> See exactly how the shelf price splits between you,
            the distributor, and the retailer.
          </li>
        </ol>
      </div>

      <Calculator />
    </main>
  );
}
