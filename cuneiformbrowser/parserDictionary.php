<html>
<!DOCTYPE meta PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<head>
<meta content="text/html; charset=utf-8" http-equiv="Content-Type">
</head>
<body>
<?php
$dictionary = json_decode(file_get_contents("matlab/data/cuneiform/dictionary.json"), true);

// reverse dictionary

$readingdictionary = Array();

foreach($dictionary as $id => $readings) {
	foreach($readings as $read) {
		$read = parseToSpecial($read);

		$readingdictionary[$read[0]] = (string) $id;
		if($read[0] != $read[1])
			$readingdictionary[$read[1]] = (string) $id;
	}
}

file_put_contents("matlab/data/cuneiform/parserDictionary.json", json_encode($readingdictionary));

// now for multi-logogramms
if(isset($_GET["multi"]))
{
	$multidictionary = json_decode(file_get_contents("matlab/data/cuneiform/multi.json"), true);
	$newDictionary = Array();

	foreach($multidictionary as $id => $readings) {

		$id = parseToSpecial($id);
		$newDictionary[$id[0]] = Array();
		if($id[0] != $id[1])
			$newDictionary[$id[1]] = Array();
		$individualSigns = explode("-", $readings);
		foreach($individualSigns as $sign)
		{
			if(isset($readingdictionary[$sign]))
			{
				array_push($newDictionary[$id[0]], $readingdictionary[$sign]);
				if($id[0] != $id[1])
					array_push($newDictionary[$id[1]], $readingdictionary[$sign]);
			}
			else
			{
				echo "Reading not known! $sign";
				exit();
			}
		}
	}
	file_put_contents("matlab/data/cuneiform/multiSignLogogrammsDictionary.json", json_encode($newDictionary));
}

function parseToSpecial($read)
{
	$parsed = [];
	$parsed[0] = strtolower(trim($read));
	echo $parsed[0];
	// $read = str_replace("sz", "š", $read);
	// $read = str_replace("s.", "ṣ", $read);
	$rep = Array(
			"sz" => "š",
			"t," => "ṭ",
			"s," => "ṣ",
			"h" => "ḫ",
			"s'" => "ś",
			"'" => "ʾ"
			);
	$parsed[0] = strtr($parsed[0], $rep);
	echo " -> $parsed[0]";
	$parsed[1] = $parsed[0];
	$parsed[0] = replaceFirstVowel($parsed[0]);
	echo " -> $parsed[0]";
	$rep = Array(
			"1" => "₁",
			"2" => "₂",
			"3" => "₃",
			"4" => "₄",
			"5" => "₅",
			"6" => "₆",
			"7" => "₇",
			"8" => "₈",
			"9" => "₉",
			"0"	=> "₀"
			);
	$parsed[0] = strtr($parsed[0], $rep);
	$parsed[1] = strtr($parsed[1], $rep);

	echo " to $parsed[0] ($id) /$parsed[1]/<br />";
	return $parsed;
}

function replaceFirstVowel($word) {
	if(is_numeric(substr($word, -2)) || !is_numeric(substr($word, -1)))
		return $word;

	$number = intval(substr($word, -1)) - 2;
	echo " ($number) ";
	if($number > 1)
		return $word;

	$word = substr($word, 0, -1);

	$replacements = Array(
			"a" => Array(
					"á",
					"à"
			),
			"e" => Array(
					"é",
					"è"
			),
			"i" => Array(
					"í",
					"ì"
			),
			"u" => Array(
					"ú",
					"ù"
			)
	);
	$pos = strcspn($word, "aeiu");
	$word = substr_replace($word, $replacements[$word[$pos]][$number], $pos, 1);
	return $word;
}
?>


