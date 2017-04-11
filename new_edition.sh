#!/bin/zsh

BASE=./the_vise

if [[ -z $1 ]]; then
	echo "Usage: $0 <pdf> <foldername>"
	exit 1
elif [[ -z $2 ]]; then
	echo "Usage: $0 \"$1\" <foldername>"
	exit 1
fi

echo "Making magazine directory \"${BASE}/${2}\"."
mkdir -p ${BASE}/${2}

# -r 300
echo "Converting PDF to PNGs."
pdftoppm -png "${1}" "${BASE}/${2}/page"

echo "INSERTING ANAL-LOG HASH eNCRYPTION DECODING ALGORITHM"
rm "${BASE}/${2}/page-13.png"

SHEETS=(`echo $(ls -1 ${BASE}/${2}/page*.png | xargs)`)

echo "Found ${#SHEETS[@]} shits..."

echo "Rotating PNGs"
for base_png in ${BASE}/${2}/page*.png;
do
	convert -rotate 90 "${base_png}" "${base_png/.png/.rot.png}"
done

## TODO: Find vertical line
echo "Splitting in half"
for rot_png in ${BASE}/${2}/page*.rot.png;
do
	convert "${rot_png}" -crop 50%x100% +repage "${rot_png/.rot.png/.%d.split.png}"
done

pages="$(ls -1 ${BASE}/${2}/*1.split.png | sort) $(ls -1 ${BASE}/${2}/*0.split.png | sort -r)"
total_page_count=$(echo "${pages}" | wc -l)

echo "Found $total_page_count pages..."

echo "Ordering Pages"
page_number=0

state=1
for sheet_num in $(seq -w 1 ${#SHEETS[@]});
do

	# Skip bad files
	if [[ ! -f "${BASE}/${2}/page-${sheet_num}.${state}.split.png" ]];
	then
		echo "No page ${BASE}/${2}/page-${sheet_num}.${state}.split.png"
		continue
	fi

	cp "${BASE}/${2}/page-${sheet_num}.${state}.split.png" "${BASE}/${2}/$(printf %02d ${page_number}).png"

	if [[ $state -eq 1 ]];
	then
		state=0
	else
		state=1
	fi

	page_number=$(expr $page_number + 1)
done

# Do it in reverse
state=1
for sheet_num in $(seq -w ${#SHEETS[@]} -1 1);
do
	if [[ ! -f "${BASE}/${2}/page-${sheet_num}.${state}.split.png" ]];
	then
		echo "No page ${BASE}/${2}/page-${sheet_num}.${state}.split.png"
		continue
	fi

	cp "${BASE}/${2}/page-${sheet_num}.${state}.split.png" "${BASE}/${2}/$(printf %02d ${page_number}).png"

	if [[ $state -eq 1 ]];
	then
		state=0
	else
		state=1
	fi
	page_number=$(expr $page_number + 1)
done
