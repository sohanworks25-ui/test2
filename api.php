<?php
/**
 * Sohan's HMS - Backend API v1.0
 * Handles MySQL persistence for the React Frontend
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database Credentials - Update as per your local MySQL setup
$host = "localhost";
$db_name = "sohan_hms";
$username = "root";
$password = "";
$conn = null;

try {
    $conn = new PDO("mysql:host=" . $host, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Auto-create database if not exists
    $conn->exec("CREATE DATABASE IF NOT EXISTS `$db_name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $conn->exec("USE `$db_name`");
    
    // Schema Initialization
    $conn->exec("CREATE TABLE IF NOT EXISTS users (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100), username VARCHAR(50), role VARCHAR(50), email VARCHAR(100), status VARCHAR(20), data LONGTEXT)");
    $conn->exec("CREATE TABLE IF NOT EXISTS patients (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100), age INT, sex VARCHAR(10), mobile VARCHAR(20), regDate DATETIME, data LONGTEXT)");
    $conn->exec("CREATE TABLE IF NOT EXISTS professionals (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100), category VARCHAR(20), data LONGTEXT)");
    $conn->exec("CREATE TABLE IF NOT EXISTS bills (id VARCHAR(50) PRIMARY KEY, date DATETIME, totalAmount DECIMAL(15,2), paidAmount DECIMAL(15,2), dueAmount DECIMAL(15,2), patientId VARCHAR(50), referringDoctorId VARCHAR(50), consultantDoctorId VARCHAR(50), data LONGTEXT)");
    $conn->exec("CREATE TABLE IF NOT EXISTS services (id VARCHAR(50) PRIMARY KEY, category VARCHAR(100), name VARCHAR(200), price DECIMAL(15,2), data LONGTEXT)");
    $conn->exec("CREATE TABLE IF NOT EXISTS categories (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100))");
    $conn->exec("CREATE TABLE IF NOT EXISTS admissions (id VARCHAR(50) PRIMARY KEY, patientId VARCHAR(50), status VARCHAR(20), data LONGTEXT)");
    $conn->exec("CREATE TABLE IF NOT EXISTS rooms (id VARCHAR(50) PRIMARY KEY, number VARCHAR(20), status VARCHAR(20), data LONGTEXT)");
    $conn->exec("CREATE TABLE IF NOT EXISTS expenses (id VARCHAR(50) PRIMARY KEY, amount DECIMAL(15,2), date DATE, data LONGTEXT)");
    $conn->exec("CREATE TABLE IF NOT EXISTS commissions (id VARCHAR(50) PRIMARY KEY, billId VARCHAR(50), staffId VARCHAR(50), amount DECIMAL(15,2), data LONGTEXT)");
    $conn->exec("CREATE TABLE IF NOT EXISTS trash (id VARCHAR(50) PRIMARY KEY, type VARCHAR(50), data LONGTEXT, deletedAt DATETIME)");

} catch(PDOException $exception) {
    echo json_encode(["error" => "Connection error: " . $exception->getMessage()]);
    exit();
}

$route = $_GET['route'] ?? '';
$id = $_GET['id'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

function handleRequest($conn, $table, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $conn->prepare("SELECT * FROM $table WHERE id = ?");
                $stmt->execute([$id]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                echo json_encode($result ? json_decode($result['data'], true) : null);
            } else {
                $stmt = $conn->prepare("SELECT data FROM $table");
                $stmt->execute();
                $results = $stmt->fetchAll(PDO::FETCH_COLUMN);
                echo "[" . implode(",", $results) . "]";
            }
            break;
        case 'POST':
            $input = file_get_contents("php://input");
            $data = json_decode($input, true);
            $primaryId = $data['id'] ?? uniqid();
            
            // Extract some fields for indexed search if needed (Billing specific)
            $refDoc = $data['referringDoctorId'] ?? null;
            $conDoc = $data['consultantDoctorId'] ?? null;
            $patId = $data['patientId'] ?? null;

            if ($table === 'bills') {
                $stmt = $conn->prepare("REPLACE INTO bills (id, date, totalAmount, paidAmount, dueAmount, patientId, referringDoctorId, consultantDoctorId, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$primaryId, $data['date'], $data['totalAmount'], $data['paidAmount'], $data['dueAmount'], $patId, $refDoc, $conDoc, $input]);
            } else {
                $stmt = $conn->prepare("REPLACE INTO $table (id, data) VALUES (?, ?)");
                $stmt->execute([$primaryId, $input]);
            }
            echo json_encode(["status" => "success", "id" => $primaryId]);
            break;
        case 'DELETE':
            if ($id) {
                $stmt = $conn->prepare("DELETE FROM $table WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(["status" => "deleted"]);
            }
            break;
    }
}

$valid_tables = [
    'users' => 'users',
    'patients' => 'patients',
    'professionals' => 'professionals',
    'bills' => 'bills',
    'services' => 'services',
    'categories' => 'categories',
    'admissions' => 'admissions',
    'rooms' => 'rooms',
    'expenses' => 'expenses',
    'commissions' => 'commissions',
    'trash' => 'trash'
];

if (isset($valid_tables[$route])) {
    handleRequest($conn, $valid_tables[$route], $method, $id);
} else {
    echo json_encode(["error" => "Invalid Route"]);
}
?>