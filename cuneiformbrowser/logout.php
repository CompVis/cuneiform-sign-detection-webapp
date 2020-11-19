
<?php
if (session_status() !== PHP_SESSION_ACTIVE) {session_start();}

//clear session from globals
//$_SESSION = array();
unset($_SESSION["cuneidemo"]);
//remove PHPSESSID from browser
/*if ( isset( $_COOKIE[session_name()] ) )
{
	setcookie( session_name(), "", time()-3600, "/" );
}*/

// if (ini_get("session.use_cookies")) {
// 	$params = session_get_cookie_params();
// 	setcookie(session_name(), '', time() - 42000,
// 			$params["path"], $params["domain"],
// 			$params["secure"], $params["httponly"]
// 			);
// }


//clear session from disk
//session_destroy();

	// redirect to index

	header('Location: index.php');
	exit();
?>


