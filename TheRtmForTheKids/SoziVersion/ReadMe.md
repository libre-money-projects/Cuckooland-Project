First checks
============

Things to check **after modification** of the working svg file, with a text editor: 

* Search `font-size` attibutes in the definition of objects and delete them (because they should be defined in _CSS_ part).
* All "Flowed Texts" should have an `ID` of the form _Flow..._ (no default `ID` of the form _flowRoot..._).
* The title of each Sozi frame is up to date (only relevant if the content of some frames has significantly changed).
* The timing of each Sozi frame is up to date (`timeout-ms` attribute is well dimensionned?); only useful when we want to use automatic transitions (thanks to `timeout-enable` attribute set to `true`).

Playable Sozi file 
==================

To have a playable Sozi version, we have to modify the working svg file because:

* Some objects are to hide.
* _Flowed Text_ is an Inkscape object very convenient but _it was a draft SVG 1.2 specification that will not in the end be adopted. The text is not likely to be viewable by other renderers_.
* _Text_ along a _Path_ seems to significantly decrease fluidity of Sozi animation.

1. with Inkscape:

    1. open the working svg file and _Save as..._ "playableVersion.svg";
    2. find (`Ctrl+F`) the group with `ID` set to _ToHide_;
    3. convert to a _Path_ (`Ctrl+Shft+C`);
    4. hide (`Ctrl+Shft+O`, then `Alt+H`);
    5. find (`Ctrl+F`) objects with `ID` set to _CurvedText_ (in current version, 26 objects should be found);
    6. convert to a _Path_ (`Ctrl+Shft+C`);
    7. find (`Ctrl+F`) objects with `ID` set to _Flow_ (search all objects starting by "Flow"; in current version, 214 objects should be found);
    8. convert to a _Text_ (202 _Flowed Texts_ should be actually converted);
    9. execute _Vaccum Defs_ (this action is accessible in the _File_ menu);
    10. save.

2. with a text editor:

    1. open the "playableVersion.svg" file;
    2. one more time, search in object definition `font-size` attibutes and delete them (because they are defined in _CSS_ part);
    3. remove `@font-face` declaration for `poetsenone-regular`, `komika_text_tightitalic` and `linux_biolinum_capitsmallcaps` (become useless since affected _Text_ objects have been converted to _Path_);
    4. search `font-size` in CSS part and remove all the attributes about _Text_ when `font-family` is `poetsenone-regular`, `komika_text_tightitalic` or `linux_biolinum_capitsmallcaps` (become useless since affected _Text_ objects have been converted to _Path_) => in current version, only `fill` and `stroke` attributes should be remaining);
    5. find `'Komika Text';/*'komika';*/` and replace by `'komika'`;
    6. save.

If you use a new font, don't forget to add it in the "font" directory.


Pdf version
===========

**Note**: to have a pdf version of `The RTM for the kids`, the best solution is to use the Scribus version.

To have a pdf version of the Sozi presentation, we need to tune the working svg file because:

* For first and last frame, we don't want texts in bubbles, it would be too heavy for most of pdf viewers. So we don't have to convert _Flowed Text_ to _Text_.
* _Text_ along a _Path_ are no more an issue (it doesn't seem to decrease performance of pdf viewers). So we don't have to convert `CurvedText` to a _Path_.

To produce a pdf version from the working svg file (only on GNU/Linux):

1. With Inkscape:

    1. open the working svg file and _Save as..._ "for-1-and-98.svg";
    2. find (`Ctrl+F`) the group with `ID` set to "ToHide";
    3. hide (`Ctrl+Shft+O`, then `Alt+H`);
    4. find (`Ctrl+F`) objects with `ID` set to "CurvedTextRunner";
    5. convert to a _Path_ (`Ctrl+Shft+C`);
    6. save.

2. In a terminal:

    1. run: `python sozi2pdf_custum.py --include=1,98 for-1-and-98.svg`
    2. put aside the two generated files (they are in a new directory called "tmp")

3. With Inkscape:

    1. open the "for-1-and-98.svg" file and _Save as..._ "for2to97.svg"
    2. find (`Ctrl+F`) objects with `ID` set to "Flow" (search all objects starting by "Flow"; in current version, 214 objects should be found);
    3. convert to a Text (202 _Flowed Texts_ should be actually converted);
    4. save.

4. In a terminal:

    1. run: `python sozi2pdf_custum.py for2to97.svg`
    2. copy in "tmp" directory the two files put aside previously (overwrite the existing ones);
    3. run: python sozi2pdf_custum2.py for2to97.svg

**Note**: the only difference between "python sozi2pdf_custum.py" and "python sozi2pdf_custum2.py" should be the line `subprocess.call(["phantomjs", js...` which is commented in "python sozi2pdf_custum2.py".

