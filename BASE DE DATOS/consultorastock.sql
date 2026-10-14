-- Active: 1791922946155@@127.0.0.1@3306@consultorastock
DROP DATABASE IF EXISTS consultorastock;
CREATE DATABASE IF NOT EXISTS consultorastock CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE consultorastock;

-- Tabla Proveedor
CREATE TABLE IF NOT EXISTS Proveedor (
    id_proveedor INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    contacto VARCHAR(100) NOT NULL,
    mail VARCHAR(100) NOT NULL

);

-- Tabla Clientes 
CREATE TABLE IF NOT EXISTS Clientes (
    id_cliente INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre_cliente VARCHAR(150) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    telefono VARCHAR(50) NOT NULL
);

-- Tabla Producto
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

-- Tabla Pedido
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

-- Tabla Producto_pedido
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

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);





-- INSERCION DE DATOS DE PRUEBA --

INSERT INTO proveedor (nombre, contacto, mail) VALUES
('Distribuidora Los Mellizos', '234567890', 'ventas@losmellizos.com'),
('Importadora Repostera S.A.', '234567891', 'contacto@improp.com'),
('Lácteos y Derivados del Sur', '234567892', 'pedidos@lacteossur.com.ar');

INSERT INTO producto (nombre, precio_compra, precio_venta, categoria, stock, id_proveedor) VALUES
('Harina 0000 x 1kg', 1.20, 2.00, 'Insumos Básicos', 50, 1),
('Chocolate Semi-amargo Cobertura x 1kg', 8.50, 14.00, 'Chocolatería', 20, 1),
('Dulce de Leche Repostero x 5kg', 12.00, 18.50, 'Rellenos', 15, 2),
('Esencia de Vainilla Profesional x 1L', 3.00, 5.50, 'Esencias y Colorantes', 25, NULL),
('Molde Desmontable Aluminio 24cm', 6.00, 11.00, 'Utensilios', 10, NULL),
('Granas de Colores x 100g', 0.80, 2.00, 'Decoración', 40, 2),
('Crema de Leche x 1L', 4.50, 7.50, 'Lácteos', 30, 1),
('Azúcar Impalpable x 1kg', 1.50, 2.50, 'Insumos Básicos', 35, NULL);

INSERT INTO Clientes (nombre_cliente, direccion, telefono) VALUES
('Juan Pérez', 'Av. San Martín 1234, Tres Arroyos', '2983-456789'),
('María Gómez', 'Rivadavia 567, Tres Arroyos', '2983-123456'),
('Carlos López', 'Chacabuco 890, Tres Arroyos', '2983-987654'),
('Ana Fernández', 'Belgrano 321, Tres Arroyos', '2983-112233');


INSERT INTO Pedido (fecha, id_cliente, total_pedido) VALUES 
('2026-10-01 10:30:00', 1, 15000.50),
('2026-10-05 14:15:00', 2, 8500.00),
('2026-10-10 09:00:00', 3, 24300.75);

INSERT INTO Producto_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES 
(1, 1, 2, 5000.00),
(1, 2, 1, 5000.50),
(2, 3, 3, 2833.33),
(3, 2, 2, 6000.00),
(3, 4, 1, 12300.75);
