import React from "react";

export default function Brand({ claro = false, grande = false, mostrarTexto = true }) {
  return (
    <span
      className={`marca-popular ${claro ? "marca-popular--claro" : ""} ${
        grande ? "marca-popular--grande" : ""
      }`}
    >
      <span className="marca-popular__logo" aria-hidden="true">
        P
      </span>
      {mostrarTexto && (
        <span className="marca-popular__texto">
          <strong>Popular</strong>
          <span>Cocina Boliviana</span>
        </span>
      )}
    </span>
  );
}
