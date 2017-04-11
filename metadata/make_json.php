<?php
	define("STORY_DIR", "the_vise");

	foreach (glob(STORY_DIR . "/*") as $story)
	{
		$story = basename($story);

		$path = STORY_DIR . "/" . $story;

		$pages = glob("$path/*.png");

		file_put_contents("metadata/list_${story}.json", json_encode($pages));
	}

	$listing = array_map(basename, glob(STORY_DIR . "/*", GLOB_ONLYDIR));

	file_put_contents("metadata/list.json", json_encode($listing));

?>
