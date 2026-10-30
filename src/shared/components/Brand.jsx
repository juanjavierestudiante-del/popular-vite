import React from "react";

export default function Brand({ claro = false, grande = false, mostrarTexto = false }) {
  return (
    <span
      className={`marca-popular ${claro ? "marca-popular--claro" : ""} ${
        grande ? "marca-popular--grande" : ""
      }`}
    >
      <img
        className="marca-popular__logo"
        src="/images/logo-popular.png"
        alt="Popular Cocina Boliviana"
        width="488"
        height="272"
        decoding="async"
      />
      {mostrarTexto && (
        <span className="marca-popular__texto">
          <strong>Popular</strong>
          <span>Cocina Boliviana</span>
        </span>
      )}
    </span>
  );
}
