-- Active: 1791328944833@@127.0.0.1@3306@consultorastock
CREATE DATABASE IF NOT EXISTS consultorastock CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE consultorastock;

-- -----------------------------------------------------
-- 1. Tabla Proveedor
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Proveedor (
    id_proveedor INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    contacto VARCHAR(100) NOT NULL,
    mail VARCHAR(100) NOT NULL

-- -----------------------------------------------------
-- 2. Tabla Clientes
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Clientes (
    id_cliente INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre_cliente VARCHAR(150) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    telefono VARCHAR(50) NOT NULL
);

-- -----------------------------------------------------
-- 3. Tabla Producto (Sin SKU)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Producto (
    id_producto INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    precio_compra DECIMAL(10,2) NOT NULL,
    precio_venta DECIMAL(10,2) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    id_proveedor INT NULL,
    CONSTRAINT fk_producto_proveedor
    FOREIGN KEY (id_proveedor)
    REFERENCES Proveedor (id_proveedor)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- 4. Tabla Pedido (Cabecera)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Pedido (
    id_pedido INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_cliente INT NOT NULL,
    total_pedido DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_pedido_cliente
    FOREIGN KEY (id_cliente)
    REFERENCES Clientes (id_cliente)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- 5. Tabla Producto_pedido (Detalle del carrito)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Producto_pedido (
    id_pedido INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id_pedido, id_producto),
    CONSTRAINT fk_pp_pedido
    FOREIGN KEY (id_pedido)
    REFERENCES Pedido (id_pedido)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
    CONSTRAINT fk_pp_producto
    FOREIGN KEY (id_producto)
    REFERENCES Producto (id_producto)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
)