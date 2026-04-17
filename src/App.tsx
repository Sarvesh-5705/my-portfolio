/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Navbar from "@/components/Navbar";
import Scrollytelling from "@/components/Scrollytelling";

export default function App() {
  return (
    <main className="relative w-full bg-black selection:bg-white/30">
      <Navbar />
      <Scrollytelling />
    </main>
  );
}
