import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import dinProUrl from "@assets/DINPro_1777358240556.ttf";
import dinProBoldUrl from "@assets/DINPro-Bold_1777358240555.ttf";

[
  { weight: "400", url: dinProUrl },
  { weight: "700", url: dinProBoldUrl },
].forEach(({ weight, url }) => {
  const ff = new FontFace("DIN Pro", `url(${url})`, {
    weight,
    style: "normal",
    display: "swap",
  });
  ff.load()
    .then((loaded) => document.fonts.add(loaded))
    .catch(() => {});
});

createRoot(document.getElementById("root")!).render(<App />);
