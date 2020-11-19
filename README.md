# Cuneiform-Sign-Detection-Webapp

Authors: Tobias Dencker - <tobias.dencker@gmail.com> and Pablo Klinkisch - <pklinkisch@hotmail.com>

This repository contains the web front-end of the web application presented in the article submission "Deep learning of cuneiform sign detection with weak supervision using transliteration alignment".

The web front-end offers the following functionality:

- create collections of tablet images
- upload tablet images
- apply the sign detector
- visualize sign detections
- annotate cuneiform signs
- annotate lines

The web front-end has been developed using a combination of PHP and JavaScript.


### Requirements

- Apache web server (otherwise replace `.htaccess` files)
- PHP7 (with php-xml, php-curl, php-zip, php-gd packages)


### Installation

1) Create a copy of this repository on your machine so that the installed web server makes the web front end available through the browser.

2) Ensure that the `cuneiformbrowser/data` and `cuneiformbrowser/log` directory is writable.
One of several options is to use the chmod command, e.g. `$chmod -R 777 ./cuneiformbrowser/log/`

3) Setup your login preferences under `cuneiformbrowser/users/users.xml`.
(WARNING: the user access management is very basic and only provides a low level of protection)

4) To enable sign detection in the web front end, install the [cuneiform-sign-detection-code](https://github.com/compvis/cuneiform-sign-detection-code/) on the same machine and run the webapp back-end using `$python detector_app.py`.
For instruction how to run the webapp back-end, refer to the readme provided in [./lib/webapp/](https://github.com/compvis/cuneiform-sign-detection-code/blob/master/lib/webapp/).


### Usage

Please refer to the video and the help texts provided throughout the web front-end.

<img src="https://cunei.iwr.uni-heidelberg.de/cuneiformbrowser/functions/demo_cuneiform_sign_detection.gif" alt="Web interface detection" width="700"/>


#### References

The two example images of clay tablets included in this repo are from the collection of the [Vorderasiatisches Museum Berlin](https://www.smb.museum/en/museums-institutions/vorderasiatisches-museum/home.html) which kindly granted us permission to use them for our research purposes.
