
*************************************************
Things to check after modification of the working svg file, with a text editor: 
- search in object definition "font-size" attibutes and delete them (because they are defined in CSS part);
- all "Flow Texts" should have an id of the form "Flow..." (no default id of the form "flowRoot...");
- the title of frames is up to date;
- the timing of frames is up to date ("timeout-ms" attribute is well dimensionned?); only useful when we want to use automatic transitions (thanks to "timeout-enable" attribute set to "true").

*************************************************
Procedure to produce a playable version from the working svg file

First, with Inkscape :
- open the working svg file and save as... "playableVersion.svg";
- find (Ctrl+F) the group with id "ToHide";
- convert to a Path (Ctrl+Shft+C);
- hide (Ctrl+Shft+O, then Alt+H);
- find (Ctrl+F) objects with id "CurvedText" (in current version, 26 objects should be found);
- convert to a Path (Ctrl+Shft+C);
- find (Ctrl+F) objects with id "Flow" (in current version, 214 objects should be found);
- convert to a Text (202 "Flow Texts" are actually converted);
- execute "Vaccum Defs" (this action is accessible in the "File" menu);
- save.

Second, with a text editor:
- open the "playableVersion.svg" file;
- one more time, search in object definition "font-size" attibutes and delete them (because they are defined in CSS in css part);
- remove "@font-face" declaration for "poetsenone-regular", "komika_text_tightitalic" and "linux_biolinum_capitsmallcaps" (become useless since affected Text objects have been converted to Path);
- search "font-size" in CSS part and remove all the attributes about "Text" when "font" is "poetsenone-regular", "komika_text_tightitalic" or "linux_biolinum_capitsmallcaps" (become useless since affected Text objects have been converted to Path) => in current version, only "fill" and "stroke" attributes should be remaining);
- find "'Komika Text';/*'komika';*/" and replace by "'komika'"
- save.

If you use a new font, don't forget to add it in the "font" directory.


*************************************************
Procedure to produce a pdf version from the working svg file (only on GNU/Linux)

With Inkscape:
- open the working svg file and save as... "for-1-and-98.svg";
- find (Ctrl+F) the group with id "ToHide";
- hide (Ctrl+Shft+O, then Alt+H);
- find (Ctrl+F) the group with id "CurvedTextRunner";
- convert to a Path (Ctrl+Shft+C);
- save.

In a terminal:
- run: python sozi2pdf_custum.py --include=1,98 for-1-and-98.svg
- put aside the two generated files (they are in a new directory called "tmp")

With Inkscape:
- open the "for-1-and-98.svg" file and save as... "for2to97.svg"
- find (Ctrl+F) objects with id "Flow" (in current version, 214 objects should be found);
- convert to a Test (202 "Flow Texts" are actually converted);
- save

In a terminal:
- run: python sozi2pdf_custum.py for2to97.svg
- copy in "tmp" directory the two files put aside previously (overwrite the existing ones);
- run: python sozi2pdf_custum2.py for2to97.svg

Note: the only difference between "python sozi2pdf_custum.py" and "python sozi2pdf_custum2.py" is the line "subprocess.call(["phantomjs", js..." which is commented in "python sozi2pdf_custum2.py"

