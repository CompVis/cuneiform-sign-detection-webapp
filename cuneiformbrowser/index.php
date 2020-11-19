<?php if(session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}
	// Call session manager and check if a user is logged in
	include('sessionManagement.php');
	include_once('config.php');
	include("./start.php");

?>


