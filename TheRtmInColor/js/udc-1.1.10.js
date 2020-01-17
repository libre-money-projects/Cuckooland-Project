/*
 * Codage :
 * - ne faire que du relatif ; supprimer les "px" (resizestop)
 * - sliders qui disparaissent (avec  ie7) par exemple quand on selectionne la cellule de la masse monétaire à l'année 0, ou quand survol des onglets
 * - alignement mauvais des labels et des formulaire sous ie7
 * - tester le profiler
 * - améliorer html pour referencement Google
 * - utiliser les tags préexistants (comme H1, H2...)
 * - finesse sliders
 * - dans quantitativePlot1, écarter les axes Ox et Oy du (0 ; 0)
 *
 */
// On utilise une IEF pour ne pas polluer l'espace global
(function () {
    // Masse monétaire par défaut
    var DEFAULT_T0_MONEY_SUPPLY = 10000000,
        // Nombre d'individus par défaut
        DEFAULT_INDIVIDUAL_NUMBER = 330,
        // Espérance de vie par défaut
        DEFAULT_LIFE_EXPECTANCY = 80,
        // Nombre d'années visitables
        TOTAL_YEARS_COUNT = 120,
        // Nombre de pas pour capital de l'individu à l'année 0
        T0_MONEY_STEP_COUNT = 20,
        // Constante pour "pas de mise en couleur"
        NO_HL = 'NO_HL',
        // Constante pour "mise en couleur de selection"
        SELECT_HL = 'SELECT_HL',
        // Constante pour "mise en couleur de reference"
        COLOR_HL = 'COLOR_HL',
        // Masse monétaire courante
        t0MoneySupply = DEFAULT_T0_MONEY_SUPPLY,
        // Nombre d'individus courant courant
        individualNumber = DEFAULT_INDIVIDUAL_NUMBER,
        // Espérance de vie courante
        lifeExpectancy = DEFAULT_LIFE_EXPECTANCY,
        // Taux du dividende universel fixé par l'utilisateur
        userUdRate = '',
        // Année courante
        curYear = '',
        // Nombre de ligne courant
        rowCount = 1,
        // Index colonne courante
        curColumn = '',
        // Nombre de  colonnes courant
        columnCount = 3,
        // Capital à l'année 0 (facteur multiplicatif par rapport à l'égale répartition)
        scaledT0Money = 0,
        // Liste des éléments mis en couleur
        highlightedElements = [],
        // Plot pour la representation quantitative
        quantitativePlot1 = '',
        // Plot pour la representation relative
        relativePlot1 = '',
        // Camembert
        pieChart = '',
        // Booléen indiquant si la mise à jour des commentaires doit etre faite automatiquement
        autoComment = true,
        // Liste des pages de commentaires
        commentSelection = {},
        // Liste répertoriant les différents éléments des commentaires pouvant être colorés, liés...
        dynamicElements = {},
        // Liste répertoriant les différents formulaires pouvant être commentés...
        udcForms = {},
        // Liste répertoriant les différents colonnes du tableau pouvant être commentés...
        udcColumns = {},
        // Couleur (arrière-plan) à restaurer après avoir surligné le formulaire lié à un élément du commentaire
        formBgColorToRestore = '',
        // Couleur (avant-plan) à restaurer après avoir surligné le formulaire lié à un élément du commentaire
        formColorToRestore = '',
        // Couleur (arrière-plan) à restaurer après avoir surligné la cellule liée à un élément du commentaire
        cellBgColorToRestore = '',
        // Couleur (avant-plan) à restaurer après avoir surligné la cellule liée à un élément du commentaire
        cellColorToRestore = '';

    if (!window.console) {
        window.console = {
            log: function (str) {}
        };
    }

    function formatValue(toFormat) {
        var toFormatAsString = toFormat.toString(),
            dotIndex = toFormatAsString.indexOf('.'),
            pieces = toFormatAsString.split('.'),

            decimalPart = '',
            integerPartToFormat = toFormatAsString,
            formated = '',
            begin = '',
            end = '',
            i = 0;

        if (dotIndex !== -1) {
            integerPartToFormat = pieces[0];
            if (pieces[1].length > 2) {
                decimalPart = udcLabels.decimalSeparator + pieces[1].substring(0, 2);
            } else {
                decimalPart = udcLabels.decimalSeparator + pieces[1];
            }
        }

        for (i = 0; i < integerPartToFormat.length / 3; i = i + 1) {
            begin = integerPartToFormat.length - 3 * (i + 1);
            end = integerPartToFormat.length - 3 * i;
            if (formated.length === 0) {
                formated = integerPartToFormat.substring(begin, end);
            } else {
                formated = integerPartToFormat.substring(begin, end) + '\u00A0' + formated;
            }
        }
        return formated + decimalPart;
    }

    function unformatValue(toUnformat) {
        var unformated = toUnformat.replace(/\s/g, '');
        return unformated;
    }

    function parseValue(toParse) {
        var unformated = unformatValue(toParse);
        if (toParse.indexOf(udcLabels.decimalSeparator) !== -1) {
            if (toParse.indexOf(',') !== -1) {
                unformated = unformated.replace(udcLabels.decimalSeparator, '.');
            }
            var parsed = parseFloat(unformated);
            return parsed;
        }
        else {
            var parsed = parseInt(unformated);
            return parsed;
        }
    }

    function decodeCellRow(toDecode) {
        if (/^row([0-9]+)$/.test(toDecode)) {
            return parseInt(RegExp.$1, 10);
        }
        return '';
    }

    function encodeCellRow(i) {
        return 'row' + i;
    }

    function decodeCellCoord(toDecode) {
        if (/^row([0-9]+)col([0-9]+)$/.test(toDecode)) {
            return {
                row: parseInt(RegExp.$1, 10),
                col: parseInt(RegExp.$2, 10)
            };
        }
        return '';
    }

    function encodeCellCoord(i, j) {
        return 'row' + i + 'col' + j;
    }

    function decodeFormId(toDecode) {
        if (/^formId ([a-zA-Z0-9]+)$/.test(toDecode)) {
            return RegExp.$1;
        }
        return '';
    }

    function encodeFormId(formId) {
        return 'formId ' + formId;
    }

    function computeSymetricUd(center) {
        var duMax = 100 * (Math.pow(center, 1 / center) - 1);
        return duMax;
    }

    function computeUdMin() {
        return computeSymetricUd(lifeExpectancy);
    }

    function computeUdMax() {
        return computeSymetricUd(lifeExpectancy / 2);
    }

    function getFixedUdRate() {
        if ($('input[name=UdRadio]:checked', '.stepRowForm').val() === 'userUd') {
            return userUdRate;
        }

        if ($('input[name=UdRadio]:checked', '.stepRowForm').val() === 'minUd') {
            return computeUdMin();
        }

        if ($('input[name=UdRadio]:checked', '.stepRowForm').val() === 'maxUd') {
            return computeUdMax();
        }
    }

    function getDoublingTime() {
        var doublingTime = Math.log(2) / (getFixedUdRate() / 100);
        return Math.round(doublingTime);
    }

    function getTenfoldIncreaseTime() {
        var tenfoldIncreaseTime = Math.log(10) / (getFixedUdRate() / 100);
        return Math.round(tenfoldIncreaseTime);
    }

    function getDefaultYear() {
        var year = rowCount - 1;
        if (typeof curYear === "number") {
            year = curYear;
        }
        return year;
    }

    function getDefaultColumn() {
        var col = columnCount - 1;
        if (typeof curColumn === "number") {
            col = curColumn;
        }
        return col;
    }

    function showComment(commentId, changeCommentPage) {
        if (changeCommentPage || autoComment) {
            var divs = document.getElementsByTagName('div'),
                divsLength = divs.length,
                i = 0,
                commentsList = document.getElementById('commentsList');

            for (i = 0; i < divsLength; i = i + 1) {
                if (divs[i].className === 'comment') {
                    if (divs[i].id === commentId) {
                        divs[i].style.display = 'inline-block';
                    } else {
                        divs[i].style.display = 'none';
                    }
                }
            }

            commentsList.value = commentId;
        }
    }

    function addToHighlightedElements(elementClass) {
        var index = jQuery.inArray(elementClass, highlightedElements);
        if (index < 0) {
            highlightedElements.push(elementClass);
        }
    }

    function elementSelected(element) {
        element.style.fontWeight = 'bold';
    }

    function elementHighlighted(element, color) {
        element.style.fontWeight = 'bold';
        if (color) {
            element.style.color = color;
            if (element.className.indexOf('linked') !== -1) {
                element.style.borderBottomColor = color;
            }
        }
    }

    function removeElementHighlight(element) {
        element.style.fontWeight = element.parentNode.style.fontWeight;
        element.style.color = element.parentNode.style.color;
        if (element.className.indexOf('linked') !== -1) {
            element.style.borderBottomColor = element.parentNode.style.color;
        }
    }

    function undoClassHighlight(elementClass) {
        $('.' + elementClass + '.colored').each(function () {
            removeElementHighlight(this);
        });
    }

    function doRowHighlight(row) {
        if (row >= 0) {
            var selectedRowId = encodeCellRow(row);
            addToHighlightedElements(selectedRowId);
            $("#" + selectedRowId).css({
                border: '2px solid #888888'
            });
        }
    }

    function removeRowHighlight(row) {
        if (row >= 0) {
            var selectedRowId = encodeCellRow(row);
            $("#" + selectedRowId).css({
                border: '1px solid #aaaaaa'
            });
        }
    }

    function clearHighLight() {
        var i, coord, cell, row, formId, form, curHighlightedElem,
            highlightedLength = highlightedElements.length;

        for (i = 0; i < highlightedLength; i = i + 1) {
            curHighlightedElem = highlightedElements.pop();
            coord = decodeCellCoord(curHighlightedElem);
            if (coord) {
                cell = document.getElementById(curHighlightedElem);
                if (cell !== null) {
                    removeElementHighlight(cell);
                }
            } else {
                row = decodeCellRow(curHighlightedElem);
                if (typeof row === "number") {
                    removeRowHighlight(row);
                } else {
                    formId = decodeFormId(curHighlightedElem);
                    if (formId) {
                        form = document.getElementById(formId);
                        removeElementHighlight(form);
                    } else {
                        undoClassHighlight(curHighlightedElem);
                    }
                }
            }
        }
    }

    function DynamicElement(elementClass, color) {
        this.elementClass = elementClass;
        this.color = color;
    }

    dynamicElements.defaultMoneySupply = new DynamicElement('defaultMoneySupply', '#85802b');
    dynamicElements.t0MoneySupply = new DynamicElement('t0MoneySupply', '#85802b');
    dynamicElements.defaultIndividualNumber = new DynamicElement('defaultIndividualNumber', '#953579');
    dynamicElements.individualNumber = new DynamicElement('individualNumber', '#953579');
    dynamicElements.individualNumberMinusOne = new DynamicElement('individualNumberMinusOne', '#953579');
    dynamicElements.udRate = new DynamicElement('udRate', '#c7754c');
    dynamicElements.minUd = new DynamicElement('minUd', '#c7754c');
    dynamicElements.maxUd = new DynamicElement('maxUd', '#c7754c');
    dynamicElements.lifeExpectancy = new DynamicElement('lifeExpectancy', '#4b5de4');
    dynamicElements.halfLifeExpectancy = new DynamicElement('halfLifeExpectancy', '#4b5de4');
    dynamicElements.doublingTime = new DynamicElement('doublingTime', '#e06666');
    dynamicElements.tenfoldIncreaseTime = new DynamicElement('tenfoldIncreaseTime', '#e06666');
    dynamicElements.year = new DynamicElement('year', '#e06666');
    dynamicElements.previousYear = new DynamicElement('previousYear', '#e06666');
    dynamicElements.addedRow = new DynamicElement('addedRow', '#e06666');
    dynamicElements.addedColumn = new DynamicElement('addedColumn', '#800000');
    dynamicElements.moneySupply = new DynamicElement('moneySupply', '#85802b');
    dynamicElements.previousMoneySupply = new DynamicElement('previousMoneySupply', '#85802b');
    dynamicElements.t40MoneySupply = new DynamicElement('t40MoneySupply', '#85802b');
    dynamicElements.t80MoneySupply = new DynamicElement('t80MoneySupply', '#85802b');
    dynamicElements.moneyIncrease = new DynamicElement('moneyIncrease', '#008B8B');
    dynamicElements.previousMoneyIncrease = new DynamicElement('previousMoneyIncrease', '#008B8B');
    dynamicElements.moneyIncreaseT0 = new DynamicElement('moneyIncreaseT0', '#008B8B');
    dynamicElements.increasePerIndividual = new DynamicElement('increasePerIndividual', '#228b22');
    dynamicElements.previousIncreasePerIndividual = new DynamicElement('previousIncreasePerIndividual', '#228b22');
    dynamicElements.increasePerIndividualT0 = new DynamicElement('increasePerIndividualT0', '#228b22');
    dynamicElements.cumulatedIncreasePerIndividual = new DynamicElement('cumulatedIncreasePerIndividual', '#000080');
    dynamicElements.previousCumulatedIncreasePerIndividual = new DynamicElement('previousCumulatedIncreasePerIndividual', '#000080');
    dynamicElements.cumulatedIncreasePerIndividualT7 = new DynamicElement('cumulatedIncreasePerIndividualT7', '#000080');
    dynamicElements.equalDistribPerIndividual = new DynamicElement('equalDistribPerIndividual', '#e77a2c');
    dynamicElements.equalDistribPerIndividualByDU = new DynamicElement('equalDistribPerIndividualByDU', '#e77a2c');
    dynamicElements.cumulatedIncreaseByEqualDistrib = new DynamicElement('cumulatedIncreaseByEqualDistrib', '#c5b47f');
    dynamicElements.increasePerMonth = new DynamicElement('increasePerMonth', '#f08080');
    dynamicElements.increasePerMonthT0 = new DynamicElement('increasePerMonthT0', '#f08080');
    dynamicElements.increasePerMonthT7 = new DynamicElement('increasePerMonthT7', '#f08080');
    dynamicElements.individualDebt = new DynamicElement('individualDebt', '#f08080');
    dynamicElements.nothingYear0Individual = new DynamicElement('nothingYear0Individual', '#4bb2c5');
    dynamicElements.nothingYear0IndividualByDU = new DynamicElement('nothingYear0IndividualByDU', '#4bb2c5');
    dynamicElements.nothingCumulatedByEqualDistrib = new DynamicElement('nothingCumulatedByEqualDistrib', '#c5b47f');
    dynamicElements.allYear0Individual = new DynamicElement('allYear0Individual', '#0084ff');
    dynamicElements.allYear0IndividualPerCent = new DynamicElement('allYear0IndividualPerCent', '#0084ff');
    dynamicElements.nothingYear0Individuals = new DynamicElement('nothingYear0Individuals', '#228b22');
    dynamicElements.nothingYear0IndividualsPerCent = new DynamicElement('nothingYear0IndividualsPerCent', '#228b22');
    dynamicElements.scaledT0Money = new DynamicElement('scaledT0Money', '#85802b');
    dynamicElements.naturalT0Money = new DynamicElement('naturalT0Money', '#85802b');

    DynamicElement.prototype.doClassInject = function (toInject) {
        var selector = '.' + this.elementClass + '.injected';
        $(selector).text(toInject);
    };

    DynamicElement.prototype.doClassHighlight = function (hlType) {
        if (hlType !== NO_HL) {
            var color = this.color;
            $('.' + this.elementClass + '.colored').each(function () {
                if (hlType === COLOR_HL) {
                    elementHighlighted(this, color);
                } else {
                    elementSelected(this);
                }
            });

            addToHighlightedElements(this.elementClass);
        }
    };

    function UdcForm(formId, commentId, elementsToSelect, elementsToColor) {
        this.formId = formId;
        this.commentId = commentId;
        this.elementsToSelect = elementsToSelect;
        this.elementsToColor = elementsToColor;
        this.color = elementsToSelect[0].color;
    }

    UdcForm.prototype.doFormComment = function (changeCommentPage) {
        var i, j,
            commentsList = document.getElementById('commentsList'),
            previousCommentId = commentsList.options[commentsList.selectedIndex].value;

        showComment(this.commentId, changeCommentPage);

        clearHighLight();

        this.doHighlight(SELECT_HL);

        for (i = 0; i < this.elementsToSelect.length; i = i + 1) {
            if (this.elementsToSelect[i] instanceof DynamicElement) {
                this.elementsToSelect[i].doInject();
                this.elementsToSelect[i].doHighlight(SELECT_HL);
            } else if (typeof this.elementsToSelect[i] === 'string') {
                udcForms[this.elementsToSelect[i]].doFormHighlight(SELECT_HL);
            }
        }

        for (j = 0; j < this.elementsToColor.length; j = j + 1) {
            if (this.elementsToColor[j] instanceof DynamicElement) {
                this.elementsToColor[j].doInject();
                this.elementsToColor[j].doHighlight(COLOR_HL);
            } else if (typeof this.elementsToColor[j] === 'string') {
                udcForms[this.elementsToColor[j]].doFormHighlight(COLOR_HL);
            }
        }

        if (!changeCommentPage && !autoComment) {
            commentSelection[previousCommentId]();
        }
    };

    UdcForm.prototype.doHighlight = function (hlType) {
        if (hlType !== NO_HL) {
            if (hlType === COLOR_HL) {
                elementHighlighted(document.getElementById(this.formId), this.color);
            } else {
                elementSelected(document.getElementById(this.formId));
            }
            addToHighlightedElements(encodeFormId(this.formId));

            if (this.formId === 't0MoneySupplyForm') {
                udcColumns.MONEY_SUPPLY.doCellHighlight(hlType, 0);
            }
        }
    };

    UdcForm.prototype.showLink = function (doShow) {
        if (doShow) {
            formBgColorToRestore = $("#" + this.formId).css('background-color');
            formColorToRestore = $("#" + this.formId).css('color');
            $("#" + this.formId).css('background-color', formColorToRestore);
            $("#" + this.formId).css('color', formBgColorToRestore);
        } else if (formBgColorToRestore && formColorToRestore) {
            $("#" + this.formId).css('background-color', formBgColorToRestore);
            $("#" + this.formId).css('color', formColorToRestore);
            formBgColorToRestore = '';
            formColorToRestore = '';
        }
        /*if (doShow)
        {
            $("#" + this.formId).css('text-decoration', 'underline');
        }
        else
        {
            $("#" + this.formId).css('text-decoration', 'none');
        }*/
    };
    
    udcForms.t0MoneySupplyForm = new UdcForm('t0MoneySupplyForm',
        't0MoneySupply', [dynamicElements.t0MoneySupply], []);
    udcForms.individualNumberForm = new UdcForm('individualNumberForm',
        'individualNumber', [dynamicElements.individualNumber], []);
    udcForms.userUdForm = new UdcForm('userUdForm',
        'userUd', [dynamicElements.udRate], [dynamicElements.doublingTime, dynamicElements.tenfoldIncreaseTime]);
    udcForms.lifeExpectancyForm = new UdcForm('lifeExpectancyForm',
        'lifeExpectancy', [dynamicElements.lifeExpectancy], []);
    udcForms.userUdRadio = new UdcForm('userUdRadio',
        'userUd', [dynamicElements.udRate], [dynamicElements.doublingTime, dynamicElements.tenfoldIncreaseTime]);
    udcForms.minUdRadio = new UdcForm('minUdRadio',
        'minUd', [dynamicElements.minUd], [dynamicElements.lifeExpectancy, 'lifeExpectancyForm']);
    udcForms.maxUdRadio = new UdcForm('maxUdRadio',
        'maxUd', [dynamicElements.maxUd], [dynamicElements.lifeExpectancy, dynamicElements.halfLifeExpectancy, 'lifeExpectancyForm']);

    function UdcColumn(name, commentId, elementsToSelect, elementsToColor, commentIdT0, elementsToSelectT0, elementsToColorT0) {
        this.name = name;
        this.commentId = commentId;
        this.elementsToSelect = elementsToSelect;
        this.elementsToColor = elementsToColor;
        this.commentIdT0 = commentIdT0;
        this.elementsToSelectT0 = elementsToSelectT0;
        this.elementsToColorT0 = elementsToColorT0;
        this.values = [];
        this.color = elementsToSelect[0].color;
    }

    UdcColumn.prototype.doCellComment = function (row, changeCommentPage) {
        var i, j,
            commentsList = document.getElementById('commentsList'),
            previousCommentId = commentsList.options[commentsList.selectedIndex].value,
            col = jQuery.inArray(this, udcColumnsOrder),
            toSelect = this.elementsToSelect,
            toColor = this.elementsToColor;

        if (rowCount < row + 1) {
            rowCount = row + 1;
        }

        $("#tabs").tabs("option", "active", 0);

        if (columnCount < col + 1) {
            columnCount = col + 1;
            $("#columnSlider").slider("option", "value", columnCount);
            columnCountChanged();
        }

        clearHighLight();

        curYear = row;
        curColumn = col;

        if (curYear === 0 && this.commentIdT0) {
            showComment(this.commentIdT0, changeCommentPage);
            toSelect = this.elementsToSelectT0;
            toColor = this.elementsToColorT0;
        } else {
            showComment(this.commentId, changeCommentPage);
        }

        dynamicElements.year.doClassInject(curYear);
        if (curYear > 0) {
            dynamicElements.previousYear.doClassInject(curYear - 1);
        }

        doRowHighlight(curYear);

        for (i = 0; i < toSelect.length; i = i + 1) {
            if (toSelect[i] instanceof DynamicElement) {
                toSelect[i].doInject(curYear);
                toSelect[i].doHighlight(SELECT_HL, curYear);
            } else if (toSelect[i] instanceof UdcForm) {
                toSelect[i].doFormHighlight(SELECT_HL);
            }
        }

        for (j = 0; j < toColor.length; j = j + 1) {
            if (toColor[j] instanceof DynamicElement) {
                toColor[j].doInject(curYear);
                toColor[j].doHighlight(COLOR_HL, curYear);
            } else if (toColor[j] instanceof UdcForm) {
                toColor[j].doFormHighlight(COLOR_HL);
            }
        }

        if (!changeCommentPage && !autoComment) {
            commentSelection[previousCommentId]();
        }
    };

    udcColumns.YEAR = new UdcColumn(udcLabels.YEAR,
        'yearColumn', [dynamicElements.year, dynamicElements.addedRow]);

    udcColumns.MONEY_SUPPLY = new UdcColumn(udcLabels.MONEY_SUPPLY,
        'moneySupplyColumn', [dynamicElements.moneySupply], [dynamicElements.previousMoneySupply, dynamicElements.previousMoneyIncrease],
        't0MoneySupply', [dynamicElements.moneySupply, udcForms.t0MoneySupplyForm], []);

    udcColumns.MONEY_INCREASE = new UdcColumn(udcLabels.MONEY_INCREASE,
        'moneyIncreaseColumn', [dynamicElements.moneyIncrease], [dynamicElements.moneySupply, dynamicElements.udRate, udcForms.userUdForm, dynamicElements.addedColumn],
        'moneyIncreaseColumn', [dynamicElements.moneyIncrease], [dynamicElements.moneySupply, dynamicElements.udRate, udcForms.userUdForm, udcForms.t0MoneySupplyForm, dynamicElements.addedColumn]);

    udcColumns.INCREASE_PER_INDIVIDUAL = new UdcColumn(udcLabels.INCREASE_PER_INDIVIDUAL,
        'increasePerIndividualColumn', [dynamicElements.increasePerIndividual], [dynamicElements.moneyIncrease, dynamicElements.individualNumber, udcForms.individualNumberForm]);

    udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL = new UdcColumn(udcLabels.CUMULATED_INCREASE_PER_INDIVIDUAL,
        'cumulatedIncreasePerIndividualColumn', [dynamicElements.cumulatedIncreasePerIndividual], [dynamicElements.previousIncreasePerIndividual, dynamicElements.previousCumulatedIncreasePerIndividual, dynamicElements.addedRow],
        'cumulatedIncreasePerIndividualColumnT0', [dynamicElements.cumulatedIncreasePerIndividual], [dynamicElements.addedRow]);

    udcColumns.EQUAL_DISTRIB_PER_INDIVIDUAL = new UdcColumn(udcLabels.EQUAL_DISTRIB_PER_INDIVIDUAL,
        'equalDistribPerIndividualColumn', [dynamicElements.equalDistribPerIndividual], [dynamicElements.moneySupply, dynamicElements.individualNumber, udcForms.individualNumberForm],
        'equalDistribPerIndividualColumn', [dynamicElements.equalDistribPerIndividual], [dynamicElements.moneySupply, dynamicElements.individualNumber, udcForms.individualNumberForm, udcForms.t0MoneySupplyForm]);

    udcColumns.CUMULATED_INCREASE_BY_EQUAL_DISTRIB = new UdcColumn(udcLabels.CUMULATED_INCREASE_BY_EQUAL_DISTRIB,
        'cumulatedIncreaseByEqualDistribColumn', [dynamicElements.cumulatedIncreaseByEqualDistrib], [dynamicElements.cumulatedIncreasePerIndividual, dynamicElements.equalDistribPerIndividual, dynamicElements.addedRow]);

    udcColumns.INCREASE_PER_MONTH = new UdcColumn(udcLabels.INCREASE_PER_MONTH,
        'increasePerMonthColumn', [dynamicElements.increasePerMonth], [dynamicElements.increasePerIndividual, dynamicElements.increasePerMonthT0, dynamicElements.increasePerMonthT7]);

    function updateUdcTableValues() {
        var curUdcColumn, t;
        for (curUdcColumn in udcColumns) {
            if (udcColumns.hasOwnProperty(curUdcColumn)) {
                udcColumns[curUdcColumn].values = [];
            }
        }
        for (t = 0; t < TOTAL_YEARS_COUNT + 1; t = t + 1) {
            udcColumns.YEAR.values.push(t);
            if (t === 0) {
                udcColumns.MONEY_SUPPLY.values.push(t0MoneySupply);
                udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.values.push(0);
            } else {
                udcColumns.MONEY_SUPPLY.values.push(udcColumns.MONEY_SUPPLY.values[t - 1] + udcColumns.MONEY_INCREASE.values[t - 1]);
                udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.values.push(udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.values[t - 1] + udcColumns.INCREASE_PER_INDIVIDUAL.values[t - 1]);
            }
            udcColumns.MONEY_INCREASE.values.push(udcColumns.MONEY_SUPPLY.values[t] * getFixedUdRate() / 100);
            udcColumns.INCREASE_PER_INDIVIDUAL.values.push(udcColumns.MONEY_INCREASE.values[t] / individualNumber);
            udcColumns.EQUAL_DISTRIB_PER_INDIVIDUAL.values.push(udcColumns.MONEY_SUPPLY.values[t] / individualNumber);
            udcColumns.CUMULATED_INCREASE_BY_EQUAL_DISTRIB.values.push(udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.values[t] / udcColumns.EQUAL_DISTRIB_PER_INDIVIDUAL.values[t]);
            udcColumns.INCREASE_PER_MONTH.values.push(udcColumns.INCREASE_PER_INDIVIDUAL.values[t] / 12);
        }
    }

    commentSelection.main = function () {
        updateMainComment(true);
    };
    commentSelection.t0MoneySupply = function () {
        udcForms.t0MoneySupplyForm.doFormComment(true);
    };
    commentSelection.individualNumber = function () {
        udcForms.individualNumberForm.doFormComment(true);
    };
    commentSelection.userUd = function () {
        var userUdRadio = document.getElementById(udcForms.userUdRadio.formId);
        userUdRadio.checked = true;
        udcForms.userUdForm.applyChange();
    };
    commentSelection.minUd = function () {
        var minUdRadio = document.getElementById(udcForms.minUdRadio.formId);
        minUdRadio.checked = true;
        udcForms.minUdRadio.applyChange();
    };
    commentSelection.maxUd = function () {
        var maxUdRadio = document.getElementById(udcForms.maxUdRadio.formId);
        maxUdRadio.checked = true;
        udcForms.maxUdRadio.applyChange();
    };
    commentSelection.lifeExpectancy = function () {
        udcForms.lifeExpectancyForm.doFormComment(true);
    };
    commentSelection.yearColumn = function () {
        udcColumns.YEAR.doCellComment(getDefaultYear(), true);
    };
    commentSelection.moneySupplyColumn = function () {
        udcColumns.MONEY_SUPPLY.doCellComment(getDefaultYear(), true);
    };
    commentSelection.moneyIncreaseColumn = function () {
        udcColumns.MONEY_INCREASE.doCellComment(getDefaultYear(), true);
    };
    commentSelection.increasePerIndividualColumn = function () {
        udcColumns.INCREASE_PER_INDIVIDUAL.doCellComment(getDefaultYear(), true);
    };
    commentSelection.cumulatedIncreasePerIndividualColumn = function () {
        udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.doCellComment(getDefaultYear(), true);
    };
    commentSelection.equalDistribPerIndividualColumn = function () {
        udcColumns.EQUAL_DISTRIB_PER_INDIVIDUAL.doCellComment(getDefaultYear(), true);
    };
    commentSelection.cumulatedIncreaseByEqualDistribColumn = function () {
        udcColumns.CUMULATED_INCREASE_BY_EQUAL_DISTRIB.doCellComment(getDefaultYear(), true);
    };
    commentSelection.increasePerMonthColumn = function () {
        udcColumns.INCREASE_PER_MONTH.doCellComment(getDefaultYear(), true);
    };
    commentSelection.nothingCloseToEqualPlot = function () {
        updatePlot1Comment(true);
    };
    commentSelection.oneWithAllMoneyPie = function () {
        updatePieChartComment(true);
    };

    udcForms.t0MoneySupplyForm.applyChange = function () {
        var form = document.getElementById(this.formId);
        var newT0MoneySupply = parseValue(form.value);
        if (newT0MoneySupply !== '') {
            t0MoneySupply = newT0MoneySupply;
            updateUdcTableValues();
            updateVisualizedResults();
        }
        form.value = formatValue(t0MoneySupply);

        this.doFormComment(false);
    };
    udcForms.t0MoneySupplyForm.doFormHighlight = function (hlType) {
        dynamicElements.t0MoneySupply.doClassHighlight(hlType);
        udcForms.t0MoneySupplyForm.doHighlight(hlType);
        //        udcColumns.MONEY_SUPPLY.doCellHighlight(hlType, 0);
    };

    udcForms.individualNumberForm.applyChange = function () {
        var form = document.getElementById(this.formId);
        var newIndividualNumber = parseValue(form.value);
        if (newIndividualNumber !== '') {
            individualNumber = newIndividualNumber;
            updateUdcTableValues();
            updateVisualizedResults();
        }
        form.value = formatValue(individualNumber);

        this.doFormComment(false);
    };
    udcForms.individualNumberForm.doFormHighlight = function (hlType) {
        dynamicElements.individualNumber.doClassHighlight(hlType);
        udcForms.individualNumberForm.doHighlight(hlType);
    };

    udcForms.userUdForm.applyChange = function () {
        var form = document.getElementById(this.formId);
        var newUserUdRate = parseValue(form.value);
        if (newUserUdRate !== '') {
            userUdRate = newUserUdRate;
            updateUdcTableValues();
            updateVisualizedResults();
        }
        form.value = formatValue(userUdRate);

        this.doFormComment(false);
    };
    udcForms.userUdForm.doFormHighlight = function (hlType) {
        dynamicElements.udRate.doClassHighlight(hlType);

        if ($('input[name=UdRadio]:checked', '.stepRowForm').val() === 'userUd') {
            udcForms.userUdForm.doHighlight(hlType);
        }

        if ($('input[name=UdRadio]:checked', '.stepRowForm').val() === 'minUd') {
            dynamicElements.minUd.doClassHighlight(hlType);
        }

        if ($('input[name=UdRadio]:checked', '.stepRowForm').val() === 'maxUd') {
            dynamicElements.maxUd.doClassHighlight(hlType);
        }
    };

    udcForms.lifeExpectancyForm.applyChange = function () {
        var form = document.getElementById(this.formId);
        var newLifeExpectancy = parseValue(form.value);
        if (newLifeExpectancy !== '') {
            lifeExpectancy = newLifeExpectancy;
            updateValuesInUdRadioLabels();
            updateUdcTableValues();
            updateVisualizedResults();
        }
        form.value = formatValue(lifeExpectancy);

        this.doFormComment(false);
    };
    udcForms.lifeExpectancyForm.doFormHighlight = function (hlType) {
        dynamicElements.lifeExpectancy.doClassHighlight(hlType);
        udcForms.lifeExpectancyForm.doHighlight(hlType);
    };

    udcForms.userUdRadio.applyChange = function () {
        enableFromUdRadioButtons();
        updateUdcTableValues();
        updateVisualizedResults();
        udcForms.userUdForm.doFormHighlight(SELECT_HL);
        udcForms.userUdForm.doFormComment(false);
    };

    udcForms.minUdRadio.applyChange = function () {
        enableFromUdRadioButtons();
        updateUdcTableValues();
        updateVisualizedResults();
        this.doFormComment(false);
    };

    udcForms.maxUdRadio.applyChange = function () {
        enableFromUdRadioButtons();
        updateUdcTableValues();
        updateVisualizedResults();
        this.doFormComment(false);
    };

    function updateValuesInUdRadioLabels() {
        dynamicElements.minUd.doInject();
        dynamicElements.minUd.doHighlight(NO_HL);

        dynamicElements.maxUd.doInject();
        dynamicElements.maxUd.doHighlight(NO_HL);
    }

    function enableFromUdRadioButtons() {
        var userUdRadioSelected = $('input[name=UdRadio]:checked', '.stepRowForm').val() == 'userUd';

        var lifeExpectancyForm = document.getElementById(udcForms.lifeExpectancyForm.formId);
        lifeExpectancyForm.disabled = userUdRadioSelected;

        var userUdForm = document.getElementById(udcForms.userUdForm.formId);
        userUdForm.disabled = !userUdRadioSelected;
    }

    var udcColumnsOrder = [
        udcColumns.YEAR,
        udcColumns.MONEY_SUPPLY,
        udcColumns.MONEY_INCREASE,
        udcColumns.INCREASE_PER_INDIVIDUAL,
        udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL,
        udcColumns.EQUAL_DISTRIB_PER_INDIVIDUAL,
        udcColumns.CUMULATED_INCREASE_BY_EQUAL_DISTRIB,
        udcColumns.INCREASE_PER_MONTH
    ];

    UdcColumn.prototype.doCellHighlight = function (hlType, row) {
        if (row >= 0 && hlType !== NO_HL) {
            var col = jQuery.inArray(this, udcColumnsOrder),
                selectedCellId = encodeCellCoord(row, col);
            addToHighlightedElements(selectedCellId);
            $("#" + selectedCellId).css({
                fontWeight: 'bold'
            });
            if (hlType === COLOR_HL) {
                $("#" + selectedCellId).css('color', this.color);
            }
        }
    };

    UdcColumn.prototype.showLink = function (row, doShow) {
        if (row >= 0) {
            var col = jQuery.inArray(this, udcColumnsOrder);
            var selectedCellId = encodeCellCoord(row, col);

            if (doShow) {
                cellBgColorToRestore = $("#" + selectedCellId).css('background-color');
                if (cellBgColorToRestore === 'transparent' || cellBgColorToRestore.startsWith('rgba')) {
                    var selectedRowId = encodeCellRow(row);
                    cellBgColorToRestore = $("#" + selectedRowId).css('background-color');
                }
                cellColorToRestore = $("#" + selectedCellId).css('color');
                $("#" + selectedCellId).css('background-color', cellColorToRestore);
                $("#" + selectedCellId).css('color', cellBgColorToRestore);
            } else if (cellBgColorToRestore && cellColorToRestore) {
                $("#" + selectedCellId).css('background-color', cellBgColorToRestore);
                $("#" + selectedCellId).css('color', cellColorToRestore);
                cellBgColorToRestore = '';
                cellColorToRestore = '';
            }

            /*if (doShow)
            {
                $("#" + selectedCellId).css('text-decoration', 'underline');
            }
            else
            {
                $("#" + selectedCellId).css('text-decoration', 'none');
            }*/
        }
    };

    dynamicElements.defaultMoneySupply.doInject = function () {
        var toInject = formatValue(DEFAULT_T0_MONEY_SUPPLY);
        this.doClassInject(toInject);
    };
    dynamicElements.defaultMoneySupply.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };

    dynamicElements.t0MoneySupply.doInject = function () {
        var toInject = formatValue(t0MoneySupply);
        this.doClassInject(toInject);
    };
    dynamicElements.t0MoneySupply.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };
    dynamicElements.t0MoneySupply.followLink = function () {
        commentSelection[udcForms.t0MoneySupplyForm.commentId]();
    };
    dynamicElements.t0MoneySupply.showLink = function (doShow) {
        udcForms.t0MoneySupplyForm.showLink(doShow);
        udcColumns.MONEY_SUPPLY.showLink(0, doShow);
    };

    dynamicElements.defaultIndividualNumber.doInject = function () {
        var toInject = formatValue(DEFAULT_INDIVIDUAL_NUMBER);
        this.doClassInject(toInject);
    };
    dynamicElements.defaultIndividualNumber.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };

    dynamicElements.individualNumber.doInject = function () {
        var toInject = formatValue(individualNumber);
        this.doClassInject(toInject);
    };
    dynamicElements.individualNumber.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };
    dynamicElements.individualNumber.followLink = function () {
        commentSelection[udcForms.individualNumberForm.commentId]();
    };
    dynamicElements.individualNumber.showLink = function (doShow) {
        udcForms.individualNumberForm.showLink(doShow);
    };

    dynamicElements.individualNumberMinusOne.doInject = function () {
        var toInject = formatValue(individualNumber - 1);
        this.doClassInject(toInject);
    };
    dynamicElements.individualNumberMinusOne.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };
    dynamicElements.individualNumberMinusOne.followLink = function () {
        commentSelection[udcForms.individualNumberForm.commentId]();
    };
    dynamicElements.individualNumberMinusOne.showLink = function (doShow) {
        udcForms.individualNumberForm.showLink(doShow);
    };

    dynamicElements.udRate.doInject = function () {
        var toInject = formatValue(getFixedUdRate());
        this.doClassInject(toInject + '%');
    };
    dynamicElements.udRate.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };
    dynamicElements.udRate.followLink = function () {
        if ($('input[name=UdRadio]:checked', '.stepRowForm').val() === 'userUd') {
            commentSelection[udcForms.userUdForm.commentId]();
        }

        if ($('input[name=UdRadio]:checked', '.stepRowForm').val() === 'minUd') {
            commentSelection[udcForms.minUd.commentId]();
        }

        if ($('input[name=UdRadio]:checked', '.stepRowForm').val() === 'maxUd') {
            commentSelection[udcForms.maxUd.commentId]();
        }
    };
    dynamicElements.udRate.showLink = function (doShow) {
        if ($('input[name=UdRadio]:checked', '.stepRowForm').val() === 'userUd') {
            udcForms.userUdForm.showLink(doShow);
        }

        if ($('input[name=UdRadio]:checked', '.stepRowForm').val() === 'minUd') {
            udcForms.minUd.showLink(doShow);
        }

        if ($('input[name=UdRadio]:checked', '.stepRowForm').val() === 'maxUd') {
            udcForms.maxUd.showLink(doShow);
        }
    };

    dynamicElements.minUd.doInject = function () {
        var toInject = formatValue(computeUdMin());
        this.doClassInject(toInject + '%');
    };
    dynamicElements.minUd.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };

    dynamicElements.maxUd.doInject = function () {
        var toInject = formatValue(computeUdMax());
        this.doClassInject(toInject + '%');
    };
    dynamicElements.maxUd.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };

    dynamicElements.lifeExpectancy.doInject = function () {
        var toInject = formatValue(lifeExpectancy);
        this.doClassInject(toInject);
    };
    dynamicElements.lifeExpectancy.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };
    dynamicElements.lifeExpectancy.followLink = function () {
        commentSelection[udcForms.lifeExpectancyForm.commentId]();
    };
    dynamicElements.lifeExpectancy.showLink = function (doShow) {
        udcForms.lifeExpectancyForm.showLink(doShow);
    };

    dynamicElements.halfLifeExpectancy.doInject = function () {
        var toInject = formatValue(lifeExpectancy / 2);
        this.doClassInject(toInject);
    };
    dynamicElements.halfLifeExpectancy.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };
    dynamicElements.halfLifeExpectancy.followLink = function () {
        commentSelection[udcForms.lifeExpectancyForm.commentId]();
    };
    dynamicElements.halfLifeExpectancy.showLink = function (doShow) {
        udcForms.lifeExpectancyForm.showLink(doShow);
    };

    dynamicElements.doublingTime.doInject = function () {
        var toInject = formatValue(getDoublingTime());
        this.doClassInject(toInject);
    };
    dynamicElements.doublingTime.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };

    dynamicElements.tenfoldIncreaseTime.doInject = function () {
        var toInject = formatValue(getTenfoldIncreaseTime());
        this.doClassInject(toInject);
    };
    dynamicElements.tenfoldIncreaseTime.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };

    dynamicElements.year.doInject = function (year) {
        var toInject = formatValue(udcColumns.YEAR.values[year]);
        this.doClassInject(toInject);
    };
    dynamicElements.year.doHighlight = function (hlType, year) {
        udcColumns.YEAR.doCellHighlight(hlType, year);
    };

    dynamicElements.previousYear.doInject = function (year) {
        var toInject = formatValue(udcColumns.YEAR.values[year - 1]);
        this.doClassInject(toInject);
    };
    dynamicElements.previousYear.doHighlight = function (hlType, year) {
        udcColumns.YEAR.doCellHighlight(hlType, year - 1);
    };

    dynamicElements.addedRow.doInject = function () {
        var toInject = formatValue(rowCount - 1);
        this.doClassInject(toInject);
    };
    dynamicElements.addedRow.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };

    dynamicElements.addedColumn.doInject = function () {
        var toInject = formatValue(columnCount - 3);
        this.doClassInject(toInject);
    };
    dynamicElements.addedColumn.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };

    dynamicElements.moneySupply.doInject = function (year) {
        var toInject = formatValue(udcColumns.MONEY_SUPPLY.values[year]);
        this.doClassInject(toInject);
    };
    dynamicElements.moneySupply.doHighlight = function (hlType, year) {
        this.doClassHighlight(hlType);
        udcColumns.MONEY_SUPPLY.doCellHighlight(hlType, year);
        if (year === 0) {
            udcForms.t0MoneySupplyForm.doHighlight(hlType);
        }
    };
    dynamicElements.moneySupply.followLink = function () {
        commentSelection[udcColumns.MONEY_SUPPLY.commentId]();
    };
    dynamicElements.moneySupply.showLink = function (doShow) {
        udcColumns.MONEY_SUPPLY.showLink(curYear, doShow);
        if (curYear === 0) {
            udcForms.t0MoneySupplyForm.showLink(doShow);
        }
    };

    dynamicElements.previousMoneySupply.doInject = function (year) {
        var toInject = formatValue(udcColumns.MONEY_SUPPLY.values[year - 1]);
        this.doClassInject(toInject);
    };
    dynamicElements.previousMoneySupply.doHighlight = function (hlType, year) {
        this.doClassHighlight(hlType);
        udcColumns.MONEY_SUPPLY.doCellHighlight(hlType, year - 1);
        if (year - 1 === 0) {
            udcForms.t0MoneySupplyForm.doHighlight(hlType);
        }
    };
    dynamicElements.previousMoneySupply.followLink = function () {
        curYear = curYear - 1;
        commentSelection[udcColumns.MONEY_SUPPLY.commentId]();
    };
    dynamicElements.previousMoneySupply.showLink = function (doShow) {
        udcColumns.MONEY_SUPPLY.showLink(curYear - 1, doShow);
        if (curYear - 1 === 0) {
            udcForms.t0MoneySupplyForm.showLink(doShow);
        }
    };
    dynamicElements.t40MoneySupply.showLink = function (doShow) {
        udcColumns.MONEY_SUPPLY.showLink(lifeExpectancy / 2, doShow);
    };
    dynamicElements.t40MoneySupply.followLink = function () {
        curYear = lifeExpectancy / 2;
        if (rowCount < curYear + 1) {
            rowCount = curYear + 1;
        }
        $("#rowSlider").slider("option", "value", rowCount);
        rowCountChanged();
        commentSelection[udcColumns.MONEY_SUPPLY.commentId]();
    };
    dynamicElements.t80MoneySupply.showLink = function (doShow) {
        udcColumns.MONEY_SUPPLY.showLink(lifeExpectancy, doShow);
    };
    dynamicElements.t80MoneySupply.followLink = function () {
        curYear = lifeExpectancy;
        if (rowCount < curYear + 1) {
            rowCount = curYear + 1;
        }
        $("#rowSlider").slider("option", "value", rowCount);
        rowCountChanged();
        commentSelection[udcColumns.MONEY_SUPPLY.commentId]();
    };

    dynamicElements.moneyIncrease.doInject = function (year) {
        var toInject = formatValue(udcColumns.MONEY_INCREASE.values[year]);
        this.doClassInject(toInject);
    };
    dynamicElements.moneyIncrease.doHighlight = function (hlType, year) {
        this.doClassHighlight(hlType);
        udcColumns.MONEY_INCREASE.doCellHighlight(hlType, year);
    };
    dynamicElements.moneyIncrease.followLink = function () {
        commentSelection[udcColumns.MONEY_INCREASE.commentId]();
    };
    dynamicElements.moneyIncrease.showLink = function (doShow) {
        udcColumns.MONEY_INCREASE.showLink(curYear, doShow);
    };

    dynamicElements.previousMoneyIncrease.doInject = function (year) {
        var toInject = formatValue(udcColumns.MONEY_INCREASE.values[year - 1]);
        this.doClassInject(toInject);
    };
    dynamicElements.previousMoneyIncrease.doHighlight = function (hlType, year) {
        this.doClassHighlight(hlType);
        udcColumns.MONEY_INCREASE.doCellHighlight(hlType, year - 1);
    };
    dynamicElements.previousMoneyIncrease.followLink = function () {
        curYear = curYear - 1;
        commentSelection[udcColumns.MONEY_INCREASE.commentId]();
    };
    dynamicElements.previousMoneyIncrease.showLink = function (doShow) {
        udcColumns.MONEY_INCREASE.showLink(curYear - 1, doShow);
    };

    dynamicElements.moneyIncreaseT0.doInject = function () {
        var toInject = formatValue(udcColumns.MONEY_INCREASE.values[0]);
        this.doClassInject(toInject);
    };
    dynamicElements.moneyIncreaseT0.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
        udcColumns.MONEY_INCREASE.doCellHighlight(hlType, 0);
    };
    dynamicElements.moneyIncreaseT0.followLink = function () {
        curYear = 0;
        commentSelection[udcColumns.MONEY_INCREASE.commentId]();
    };
    dynamicElements.moneyIncreaseT0.showLink = function (doShow) {
        udcColumns.MONEY_INCREASE.showLink(0, doShow);
    };

    dynamicElements.increasePerIndividual.doInject = function (year) {
        var toInject = formatValue(udcColumns.INCREASE_PER_INDIVIDUAL.values[year]);
        this.doClassInject(toInject);
    };
    dynamicElements.increasePerIndividual.doHighlight = function (hlType, year) {
        this.doClassHighlight(hlType);
        udcColumns.INCREASE_PER_INDIVIDUAL.doCellHighlight(hlType, year);
    };
    dynamicElements.increasePerIndividual.followLink = function () {
        commentSelection[udcColumns.INCREASE_PER_INDIVIDUAL.commentId]();
    };
    dynamicElements.increasePerIndividual.showLink = function (doShow) {
        udcColumns.INCREASE_PER_INDIVIDUAL.showLink(curYear, doShow);
    };

    dynamicElements.previousIncreasePerIndividual.doInject = function (year) {
        var toInject = formatValue(udcColumns.INCREASE_PER_INDIVIDUAL.values[year - 1]);
        this.doClassInject(toInject);
    };
    dynamicElements.previousIncreasePerIndividual.doHighlight = function (hlType, year) {
        this.doClassHighlight(hlType);
        udcColumns.INCREASE_PER_INDIVIDUAL.doCellHighlight(hlType, year - 1);
    };
    dynamicElements.previousIncreasePerIndividual.followLink = function () {
        curYear = curYear - 1;
        commentSelection[udcColumns.INCREASE_PER_INDIVIDUAL.commentId]();
    };
    dynamicElements.previousIncreasePerIndividual.showLink = function (doShow) {
        udcColumns.INCREASE_PER_INDIVIDUAL.showLink(curYear - 1, doShow);
    };

    dynamicElements.increasePerIndividualT0.doInject = function () {
        var toInject = formatValue(udcColumns.INCREASE_PER_INDIVIDUAL.values[0]);
        this.doClassInject(toInject);
    };
    dynamicElements.increasePerIndividualT0.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
        udcColumns.INCREASE_PER_INDIVIDUAL.doCellHighlight(hlType, 0);
    };
    dynamicElements.increasePerIndividualT0.followLink = function () {
        curYear = 0;
        commentSelection[udcColumns.INCREASE_PER_INDIVIDUAL.commentId]();
    };
    dynamicElements.increasePerIndividualT0.showLink = function (doShow) {
        udcColumns.INCREASE_PER_INDIVIDUAL.showLink(0, doShow);
    };

    dynamicElements.cumulatedIncreasePerIndividual.doInject = function (year) {
        var toInject = formatValue(udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.values[year]);
        this.doClassInject(toInject);
    };
    dynamicElements.cumulatedIncreasePerIndividual.doHighlight = function (hlType, year) {
        this.doClassHighlight(hlType);
        udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.doCellHighlight(hlType, year);
    };
    dynamicElements.cumulatedIncreasePerIndividual.followLink = function () {
        commentSelection[udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.commentId]();
    };
    dynamicElements.cumulatedIncreasePerIndividual.showLink = function (doShow) {
        udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.showLink(curYear, doShow);
    };

    dynamicElements.previousCumulatedIncreasePerIndividual.doInject = function (year) {
        var toInject = formatValue(udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.values[year - 1]);
        this.doClassInject(toInject);
    };
    dynamicElements.previousCumulatedIncreasePerIndividual.doHighlight = function (hlType, year) {
        this.doClassHighlight(hlType);
        udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.doCellHighlight(hlType, year - 1);
    };
    dynamicElements.previousCumulatedIncreasePerIndividual.followLink = function () {
        curYear = curYear - 1;
        commentSelection[udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.commentId]();
    };
    dynamicElements.previousCumulatedIncreasePerIndividual.showLink = function (doShow) {
        udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.showLink(curYear - 1, doShow);
    };

    dynamicElements.cumulatedIncreasePerIndividualT7.doInject = function () {
        var toInject = formatValue(udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.values[getDoublingTime()]);
        this.doClassInject(toInject);
    };
    dynamicElements.cumulatedIncreasePerIndividualT7.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
        udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.doCellHighlight(hlType, getDoublingTime());
    };
    dynamicElements.cumulatedIncreasePerIndividualT7.followLink = function () {
        curYear = getDoublingTime();
        if (rowCount < curYear + 1) {
            rowCount = curYear + 1;
        }
        $("#rowSlider").slider("option", "value", rowCount);
        rowCountChanged();
        commentSelection[udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.commentId]();
    };
    dynamicElements.cumulatedIncreasePerIndividualT7.showLink = function (doShow) {
        udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.showLink(getDoublingTime(), doShow);
    };

    dynamicElements.equalDistribPerIndividual.doInject = function (year) {
        var toInject = formatValue(udcColumns.EQUAL_DISTRIB_PER_INDIVIDUAL.values[year]);
        this.doClassInject(toInject);
    };
    dynamicElements.equalDistribPerIndividual.doHighlight = function (hlType, year) {
        this.doClassHighlight(hlType);
        udcColumns.EQUAL_DISTRIB_PER_INDIVIDUAL.doCellHighlight(hlType, year);
    };
    dynamicElements.equalDistribPerIndividual.followLink = function () {
        commentSelection[udcColumns.EQUAL_DISTRIB_PER_INDIVIDUAL.commentId]();
    };
    dynamicElements.equalDistribPerIndividual.showLink = function (doShow) {
        udcColumns.EQUAL_DISTRIB_PER_INDIVIDUAL.showLink(curYear, doShow);
    };

    dynamicElements.equalDistribPerIndividualByDU.doInject = function (year) {
        var nothingIndividualMoney = relativePlot1.series[1].data[year][1],
            toInject = formatValue(nothingIndividualMoney);
        this.doClassInject(toInject);
    };
    dynamicElements.equalDistribPerIndividualByDU.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };

    dynamicElements.cumulatedIncreaseByEqualDistrib.doInject = function (year) {
        var toInject = formatValue(udcColumns.CUMULATED_INCREASE_BY_EQUAL_DISTRIB.values[year]);
        this.doClassInject(toInject);
    };
    dynamicElements.cumulatedIncreaseByEqualDistrib.doHighlight = function (hlType, year) {
        this.doClassHighlight(hlType);
        udcColumns.CUMULATED_INCREASE_BY_EQUAL_DISTRIB.doCellHighlight(hlType, year);
    };

    dynamicElements.increasePerMonth.doInject = function (year) {
        var toInject = formatValue(udcColumns.INCREASE_PER_MONTH.values[year]);
        this.doClassInject(toInject);
    };
    dynamicElements.increasePerMonth.doHighlight = function (hlType, year) {
        this.doClassHighlight(hlType);
        udcColumns.INCREASE_PER_MONTH.doCellHighlight(hlType, year);
    };

    dynamicElements.increasePerMonthT0.doInject = function () {
        var toInject = formatValue(udcColumns.INCREASE_PER_MONTH.values[0]);
        this.doClassInject(toInject);
    };
    dynamicElements.increasePerMonthT0.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };
    dynamicElements.increasePerMonthT0.followLink = function () {
        curYear = 0;
        commentSelection[udcColumns.INCREASE_PER_MONTH.commentId]();
    };
    dynamicElements.increasePerMonthT0.showLink = function (doShow) {
        udcColumns.INCREASE_PER_MONTH.showLink(0, doShow);
    };

    dynamicElements.increasePerMonthT7.doInject = function () {
        var toInject = formatValue(udcColumns.INCREASE_PER_MONTH.values[getDoublingTime()]);
        this.doClassInject(toInject);
    };
    dynamicElements.increasePerMonthT7.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };
    dynamicElements.increasePerMonthT7.followLink = function () {
        curYear = getDoublingTime();
        if (rowCount < curYear + 1) {
            rowCount = curYear + 1;
        }
        $("#rowSlider").slider("option", "value", rowCount);
        rowCountChanged();
        commentSelection[udcColumns.INCREASE_PER_MONTH.commentId]();
    };
    dynamicElements.increasePerMonthT7.showLink = function (doShow) {
        udcColumns.INCREASE_PER_MONTH.showLink(getDoublingTime(), doShow);
    };

    dynamicElements.individualDebt.doInject = function () {
        var toInject = formatValue(getDoublingTime() * udcColumns.INCREASE_PER_INDIVIDUAL.values[0]);
        this.doClassInject(toInject);
    };
    dynamicElements.individualDebt.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };

    dynamicElements.nothingYear0Individual.doInject = function (year) {
        var nothingIndividualMoney = quantitativePlot1.series[0].data[year][1],
            toInject = formatValue(nothingIndividualMoney);
        this.doClassInject(toInject);
    };
    dynamicElements.nothingYear0Individual.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };

    dynamicElements.nothingYear0IndividualByDU.doInject = function (year) {
        var nothingIndividualMoney = relativePlot1.series[0].data[year][1],
            toInject = formatValue(nothingIndividualMoney);
        this.doClassInject(toInject);
    };
    dynamicElements.nothingYear0IndividualByDU.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };

    dynamicElements.nothingCumulatedByEqualDistrib.doInject = function (year) {
        var nothingIndividualMoney = quantitativePlot1.series[0].data[year][1],
            equalIndividualMoney = quantitativePlot1.series[1].data[year][1],
            toInject = formatValue(nothingIndividualMoney / equalIndividualMoney);
        this.doClassInject(toInject);
    };
    dynamicElements.nothingCumulatedByEqualDistrib.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };
    dynamicElements.nothingCumulatedByEqualDistrib.followLink = function () {
        commentSelection.nothingCloseToEqualPlot();
    };
    dynamicElements.nothingCumulatedByEqualDistrib.showLink = function (doShow) {
        // Nothing to show
    };

    dynamicElements.allYear0Individual.doInject = function (year) {
        var cumulatedIncreasePerIndividual = udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.values[year],
            toInject = formatValue(t0MoneySupply + cumulatedIncreasePerIndividual);
        this.doClassInject(toInject);
    };
    dynamicElements.allYear0Individual.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };

    dynamicElements.allYear0IndividualPerCent.doInject = function (year) {
        var cumulatedIncreasePerIndividual = udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.values[year],
            allYear0Individual = t0MoneySupply + cumulatedIncreasePerIndividual,
            moneySupply = udcColumns.MONEY_SUPPLY.values[year],
            toInject = formatValue(allYear0Individual / moneySupply * 100);
        this.doClassInject(toInject + '%');
    };
    dynamicElements.allYear0IndividualPerCent.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };

    dynamicElements.nothingYear0Individuals.doInject = function (year) {
        var cumulatedIncreasePerIndividual = udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.values[year],
            toInject = formatValue((individualNumber - 1) * cumulatedIncreasePerIndividual);
        this.doClassInject(toInject);
    };
    dynamicElements.nothingYear0Individuals.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };

    dynamicElements.nothingYear0IndividualsPerCent.doInject = function (year) {
        var cumulatedIncreasePerIndividual = udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.values[year],
            moneySupply = udcColumns.MONEY_SUPPLY.values[year],
            nothingYear0Individuals = (individualNumber - 1) * cumulatedIncreasePerIndividual,
            toInject = formatValue(nothingYear0Individuals / moneySupply * 100);
        this.doClassInject(toInject + '%');
    };
    dynamicElements.nothingYear0IndividualsPerCent.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };

    dynamicElements.scaledT0Money.doInject = function () {
        var toInject = formatValue(scaledT0Money / (T0_MONEY_STEP_COUNT / 2));
        this.doClassInject(toInject);
    };
    dynamicElements.scaledT0Money.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };

    dynamicElements.naturalT0Money.doInject = function () {
        var toInject = formatValue(scaledT0Money / (T0_MONEY_STEP_COUNT / 2) * udcColumns.EQUAL_DISTRIB_PER_INDIVIDUAL.values[0]);
        this.doClassInject(toInject);
    };
    dynamicElements.naturalT0Money.doHighlight = function (hlType) {
        this.doClassHighlight(hlType);
    };

    function initCommentsAccordion() {
        $(".commentAccordion").accordion({
            heightStyle: "fill"
        });
    }

    function initStep3Tabs() {
        $("#tabs").tabs();
        $('#udcTBodyPane').height(computeTableHeight());
        $('.comment').height(computeCommentsHeight());

        $('#tabs').on('tabsactivate', function (event, ui) {
            if (ui.newPanel.attr('id') === 'tableTab') {
                if (rowCount < curYear + 1) {
                    rowCount = curYear + 1;
                }
                $('#udcTBodyPane').height(computeTableHeight());
                $("#rowSlider").slider("option", "value", rowCount - 1);
                rowCountChanged();
            } else if (ui.newPanel.attr('id') === 'plotTab') {
                if (quantitativePlot1._drawCount === 0) {
                    $('#quantitativePlot1').height(computePlot1Height());
                    $('#quantitativePlot1').width(computePlot1Width());
                    quantitativePlot1.replot({
                        resetAxes: true
                    });

                    $('#relativePlot1').height(computePlot1Height());
                    $('#relativePlot1').width(computePlot1Width());
                    relativePlot1.replot({
                        resetAxes: true
                    });
                }
                $("#yearSlider2").slider("option", "value", getDefaultYear());
                curYearChanged();
            } else if (ui.newPanel.attr('id') == 'pieTab') {
                if (pieChart._drawCount === 0) {
                    $('#pieChart').height(computePieChartHeight());
                    $('#pieChart').width(computePieChartWidth());
                    pieChart.replot({
                        resetAxes: true
                    });
                }
                $("#yearSlider3").slider("option", "value", getDefaultYear());
                curYearChanged();
            }
        });
    }

    function computeCommentsHeight() {
        var height = $('#section').height() * 0.82;
        return height;
    }

    function computeTableHeight() {
        var height = $('#section').height() * 0.365;
        return height;
    }

    function computePlot1Height() {
        var height = $('#section').height() * 0.433;
        return height;
    }

    function computePlot1Width() {
        var width = $('#section').width() * 0.6;
        return width / 2;
    }

    function computePieChartHeight() {
        var height = $('#section').height() * 0.47;
        return height;
    }

    function computePieChartWidth() {
        var width = $('#section').width() * 0.6;
        return width;
    }

    function initValuesInForm() {
        var t0MoneySupplyForm = document.getElementById(udcForms.t0MoneySupplyForm.formId);
        t0MoneySupplyForm.value = formatValue(t0MoneySupply);

        var individualNumberForm = document.getElementById(udcForms.individualNumberForm.formId);
        individualNumberForm.value = formatValue(individualNumber);

        var lifeExpectancyForm = document.getElementById(udcForms.lifeExpectancyForm.formId);
        lifeExpectancyForm.value = formatValue(lifeExpectancy);

        var userUdForm = document.getElementById(udcForms.userUdForm.formId);
        userUdForm.value = formatValue(userUdRate);

        updateValuesInUdRadioLabels();

        var userUdRadio = document.getElementById(udcForms.userUdRadio.formId);
        userUdRadio.checked = true;
        enableFromUdRadioButtons();

        var commentCheckBox = document.getElementById("commentCheckBox");
        commentCheckBox.checked = autoComment;
    }

    function initYearSlider(sliderSelector) {
        $(sliderSelector).slider({
            orientation: "horizontal",
            range: "min",
            min: 0,
            max: TOTAL_YEARS_COUNT,
            value: getDefaultYear(),
            slide: function (event, ui) {
                curYear = ui.value;
                curYearChanged();
            }
        });
    }

    function curYearChanged() {
        updateVisualizedResults();
        updateVisualizedComments();
    }

    function initRowSlider() {
        $("#rowSlider").slider({
            orientation: "horizontal",
            range: "min",
            min: 1,
            max: TOTAL_YEARS_COUNT + 1,
            value: rowCount,
            slide: function (event, ui) {
                rowCount = ui.value;
                curYear = rowCount - 1;
                rowCountChanged();
            }
        });
    }

    function rowCountChanged() {
        updateUdcTable(true);
        if ($("#tabs").tabs("option", "active") === 0) {
            var year = getDefaultYear();
            updateVisualizedComments();
            scrollForShowing(year);
            dynamicElements.addedRow.doClassInject(rowCount - 1);
        }
    }

    function scrollForShowing(year) {
        var encodedCellRow = encodeCellRow(year);
        var rowToScrollTo = document.getElementById(encodedCellRow);
        if (rowToScrollTo !== null) {
            var tBodyScrollTop = $('#udcTBodyPane').scrollTop();
            var tBodyOffsetTop = $('#udcTBodyPane').offset().top;
            var rowOffsetTop = $('#' + encodedCellRow).offset().top;

            var tBodyHeight = $('#udcTBodyPane').height();
            var rowHeight = $('#' + encodedCellRow).height();

            if (rowOffsetTop < tBodyOffsetTop) {
                var newScrollTop1 = tBodyScrollTop - (tBodyOffsetTop - rowOffsetTop);
                $('#udcTBodyPane').scrollTop(newScrollTop1);
            } else if (rowOffsetTop + rowHeight > tBodyOffsetTop + tBodyHeight) {
                var newScrollTop2 = tBodyScrollTop + (rowOffsetTop + rowHeight) - (tBodyOffsetTop + tBodyHeight);
                $('#udcTBodyPane').scrollTop(newScrollTop2);
            }
        }
    }

    function initColumnSlider() {
        $("#columnSlider").slider({
            orientation: "horizontal",
            range: "min",
            min: 3,
            max: udcColumnsOrder.length,
            value: columnCount,
            slide: function (event, ui) {
                columnCount = ui.value;
                curColumn = columnCount - 1;
                columnCountChanged();
            }
        });
    }

    function columnCountChanged() {
        updateUdcTable(true);

        var col = getDefaultColumn();
        var year = getDefaultYear();

        udcColumnsOrder[col].doCellComment(year, true);
        scrollForShowing(year);

        dynamicElements.addedColumn.doClassInject(columnCount - 3);
    }

    function initT0MoneySlider() {
        $("#t0MoneySlider").slider({
            orientation: "horizontal",
            range: "min",
            min: 0,
            max: T0_MONEY_STEP_COUNT,
            value: 0,
            slide: function (event, ui) {
                scaledT0Money = ui.value;
                scaledT0MoneyChanged();
            }
        });
    }

    function scaledT0MoneyChanged() {
        if ($("#tabs").tabs("option", "active") == 1) {
            updatePlot1();
        }
    }

    function updatePlot1() {
        var quantitativePlot1Values = buildQuantitativePlot1Values();
        quantitativePlot1.series[0].data = quantitativePlot1Values[0];
        quantitativePlot1.series[1].data = quantitativePlot1Values[1];
        quantitativePlot1.replot({
            resetAxes: ["xaxis", "yaxis"]
        });

        var relativePlot1Values = buildRelativePlot1Values();
        relativePlot1.series[0].data = relativePlot1Values[0];
        relativePlot1.series[1].data = relativePlot1Values[1];
        relativePlot1.replot({
            resetAxes: ["xaxis", "yaxis"]
        });

        updatePlot1Comment(true);
    }

    function initQuantitativePlot1() {
        var quantitativePlot1Values = buildQuantitativePlot1Values();

        quantitativePlot1 = $.jqplot('quantitativePlot1', quantitativePlot1Values, {
            //            title: 'Graphe quantitatif (en unité monétaire classique)',
            height: computePlot1Height(),
            width: computePlot1Width(),
            series: [{
                label: udcLabels.plot1Serie1,
                color: dynamicElements.nothingYear0Individual.color,
                lineWidth: 1,
                markerOptions: {
                    style: 'circle',
                    size: 3
                },
                yaxis: 'yaxis'
            }, {
                label: udcLabels.plot1Serie2,
                color: dynamicElements.equalDistribPerIndividual.color,
                lineWidth: 1,
                linePattern: 'dashed',
                markerOptions: {
                    style: 'x',
                    size: 3
                },
                yaxis: 'yaxis'
            }],
            axesDefaults: {
                labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
                labelOptions: {
                    fontFamily: 'Trebuchet MS',
                    fontSize: '90%',
                    fontWeight: 'normal'
                },
                padMin: 0
            },
            axes: {
                xaxis: {
                    label: udcLabels.plot1XAxis,
                    tickOptions: {
                        formatter: xTickFormatter
                    }
                },
                yaxis: {
                    label: udcLabels.quantitativePlot1YAxis,
                    tickOptions: {
                        formatter: yTickFormatter
                    }
                }
            },
            legend: {
                show: true,
                renderer: $.jqplot.EnhancedLegendRenderer,
                background: '#dddddddd',
                location: 'nw'
            },
            highlighter: {
                show: true,
                sizeAdjust: 3,
                formatString: udcLabels.quantitativePlot1Tooltip
            },
            cursor: {
                show: false
            }
        });
    }

    function initRelativePlot1() {
        var relativePlot1Values = buildRelativePlot1Values();

        relativePlot1 = $.jqplot('relativePlot1', relativePlot1Values, {
            //            title: 'Graphe relatif (en nombre de DU)',
            height: computePlot1Height(),
            width: computePlot1Width(),
            series: [{
                label: udcLabels.plot1Serie1,
                color: dynamicElements.nothingYear0Individual.color,
                lineWidth: 1,
                markerOptions: {
                    style: 'circle',
                    size: 3
                },
                yaxis: 'yaxis'
            }, {
                label: udcLabels.plot1Serie2,
                color: dynamicElements.equalDistribPerIndividual.color,
                lineWidth: 1,
                linePattern: 'dashed',
                markerOptions: {
                    style: 'x',
                    size: 3
                },
                yaxis: 'yaxis'
            }],
            axesDefaults: {
                labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
                labelOptions: {
                    fontFamily: 'Trebuchet MS',
                    fontSize: '90%',
                    fontWeight: 'normal'
                },
                padMin: 0
            },
            axes: {
                xaxis: {
                    label: udcLabels.plot1XAxis,
                    tickOptions: {
                        formatter: xTickFormatter
                    }
                },
                yaxis: {
                    label: udcLabels.relativePlot1YAxis,
                    tickOptions: {
                        formatter: yTickFormatter
                    }
                }
            },
            legend: {
                show: true,
                renderer: $.jqplot.EnhancedLegendRenderer,
                background: '#dddddddd',
                location: 'nw'
            },
            highlighter: {
                show: true,
                sizeAdjust: 3,
                formatString: udcLabels.relativePlot1Tooltip
            },
            cursor: {
                show: false
            }
        });
    }

    function xTickFormatter(format, val) {
        return formatValue(val);
    }

    function yTickFormatter(format, val) {
        return formatValue(val);
    }

    function buildQuantitativePlot1Values() {
        var quantitativeCumValues = [];
        var quantitativeEqualDistribValues = [];

        var t0Money = udcColumns.EQUAL_DISTRIB_PER_INDIVIDUAL.values[0];
        var t0MoneyMax = Math.min(udcColumns.MONEY_SUPPLY.values[0], 2 * udcColumns.EQUAL_DISTRIB_PER_INDIVIDUAL.values[0]);

        if (scaledT0Money < T0_MONEY_STEP_COUNT / 2) {
            t0Money = udcColumns.EQUAL_DISTRIB_PER_INDIVIDUAL.values[0] * scaledT0Money / (T0_MONEY_STEP_COUNT / 2);
        } else if (scaledT0Money > T0_MONEY_STEP_COUNT / 2) {
            var money = t0MoneyMax - udcColumns.EQUAL_DISTRIB_PER_INDIVIDUAL.values[0];
            var multiplier = scaledT0Money / (T0_MONEY_STEP_COUNT / 2) - 1;
            t0Money = udcColumns.EQUAL_DISTRIB_PER_INDIVIDUAL.values[0] + money * multiplier;
        }

        for (var i = 0; i < getDefaultYear() + 1; i = i + 1) {
            var curQCumValue = t0Money + udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.values[i];
            //curQCumValue = curQCumValue - udcColumns.MONEY_SUPPLY.values[i] / individualNumber;
            quantitativeCumValues.push([udcColumns.YEAR.values[i], curQCumValue]);

            var curQEqualDistribValue = udcColumns.EQUAL_DISTRIB_PER_INDIVIDUAL.values[i];
            //curQEqualDistribValue = curQEqualDistribValue - udcColumns.MONEY_SUPPLY.values[i] / individualNumber;
            quantitativeEqualDistribValues.push([udcColumns.YEAR.values[i], curQEqualDistribValue]);
        }
        return [quantitativeCumValues, quantitativeEqualDistribValues];
    }

    function buildRelativePlot1Values() {
        var relativeCumValues = [];
        var relativeEqualDistribValues = [];

        var t0Money = udcColumns.EQUAL_DISTRIB_PER_INDIVIDUAL.values[0];
        var t0MoneyMax = Math.min(udcColumns.MONEY_SUPPLY.values[0], 2 * udcColumns.EQUAL_DISTRIB_PER_INDIVIDUAL.values[0]);

        if (scaledT0Money < T0_MONEY_STEP_COUNT / 2) {
            t0Money = udcColumns.EQUAL_DISTRIB_PER_INDIVIDUAL.values[0] * scaledT0Money / (T0_MONEY_STEP_COUNT / 2);
        } else if (scaledT0Money > T0_MONEY_STEP_COUNT / 2) {
            var money = t0MoneyMax - udcColumns.EQUAL_DISTRIB_PER_INDIVIDUAL.values[0];
            var multiplier = scaledT0Money / (T0_MONEY_STEP_COUNT / 2) - 1;
            t0Money = udcColumns.EQUAL_DISTRIB_PER_INDIVIDUAL.values[0] + money * multiplier;
        }

        for (var i = 0; i < getDefaultYear() + 1; i = i + 1) {
            var curQCumValue = t0Money + udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.values[i];
            var curRCumValue = curQCumValue / udcColumns.INCREASE_PER_INDIVIDUAL.values[i];
            curRCumValue = Math.round(curRCumValue * 100) / 100;
            //curRCumValue = curRCumValue - 100 / getFixedUdRate();
            relativeCumValues.push([udcColumns.YEAR.values[i], curRCumValue]);

            var curQEqualDistribValue = udcColumns.EQUAL_DISTRIB_PER_INDIVIDUAL.values[i];
            var curREqualDistribValue = curQEqualDistribValue / udcColumns.INCREASE_PER_INDIVIDUAL.values[i];
            curREqualDistribValue = Math.round(curREqualDistribValue * 100) / 100;
            //curREqualDistribValue = curREqualDistribValue - 100 / getFixedUdRate();
            relativeEqualDistribValues.push([udcColumns.YEAR.values[i], curREqualDistribValue]);
        }
        return [relativeCumValues, relativeEqualDistribValues];
    }

    function updatePieChart() {
        var data = buildPieChartValues();
        pieChart.series[0].data = data;
        pieChart.replot();

        updatePieChartComment(true);
    }

    function initPieChart() {
        var data = buildPieChartValues();
        pieChart = jQuery.jqplot('pieChart', [data], {
            height: computePieChartHeight(),
            width: computePieChartWidth(),
            seriesColors: [dynamicElements.allYear0Individual.color, dynamicElements.nothingYear0Individuals.color],
            seriesDefaults: {
                shadow: false,
                renderer: jQuery.jqplot.PieRenderer,
                rendererOptions: {
                    highlightMouseOver: false,
                    startAngle: 180,
                    showDataLabels: true
                }
            },
            grid: {
                drawBorder: false,
                drawGridlines: false,
                background: '#c9c9c9',
                shadow: false
            },
            legend: {
                show: true,
                background: '#c9c9c9',
                placement: 'outside',
                rendererOptions: {
                    numberRows: 1
                },
                location: 's',
                marginTop: '0px'
            }
        });
    }

    function buildPieChartValues() {
        var data = [
            [udcLabels.pieChartSerie1, t0MoneySupply + udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.values[getDefaultYear()]],
            [udcLabels.pieChartSerie2, (individualNumber - 1) * udcColumns.CUMULATED_INCREASE_PER_INDIVIDUAL.values[getDefaultYear()]]
        ];
        return data;
    }

    function initFormListeners() {
        $("#commentsList").change(function () {
            var commentId = this.options[this.selectedIndex].value;
            commentSelection[commentId]();
        });

        for (var curFormId in udcForms) {
            if (udcForms.hasOwnProperty(curFormId)) {
                $("#" + curFormId).focus(makeFormFocusHandler(curFormId));
                $("#" + curFormId).change(makeFormChangeHandler(curFormId));
            }
        }

        $("#commentCheckBox").change(function () {
            if (this.checked) {
                autoComment = true;
                $("#commentCheckBoxLabel").css('text-decoration', 'none');
            } else {
                autoComment = false;
                $("#commentCheckBoxLabel").css('text-decoration', 'line-through');
            }
        });
    }

    function makeFormFocusHandler(formId) {
        return function () {
            udcForms[formId].doFormComment(false);
        };
    }

    function makeFormChangeHandler(formId) {
        return function () {
            udcForms[formId].applyChange();
        };
    }

    function updateVisualizedResults() {
        if ($("#tabs").tabs("option", "active") === 0) {
            updateUdcTable(false);
        }
        if ($("#tabs").tabs("option", "active") === 1) {
            updatePlot1();
        }
        if ($("#tabs").tabs("option", "active") === 2) {
            updatePieChart();
        }
    }

    function updateVisualizedComments() {
        if ($("#tabs").tabs("option", "active") === 0) {
            var col = getDefaultColumn();
            var year = getDefaultYear();
            udcColumnsOrder[col].doCellComment(year, true);
        }
        if ($("#tabs").tabs("option", "active") === 1) {
            updatePlot1Comment();
        }
        if ($("#tabs").tabs("option", "active") === 2) {
            updatePieChartComment();
        }
    }

    function initLinkedListener() {
        for (var curDynElemId in dynamicElements) {
            if (dynamicElements.hasOwnProperty(curDynElemId)) {
                var curLinkedSelector = '.' + dynamicElements[curDynElemId].elementClass + '.linked';
                //var curLinkedSelector = 'span[class~="' + dynamicElements[curDynElemId].elementClass + '"][class~="linked"]';
                $(curLinkedSelector).click(makeDynElemClickHandler());
                $(curLinkedSelector).mouseover(makeDynElemMouseOverHandler());
                $(curLinkedSelector).mouseout(makeDynElemMouseOutHandler());
            }
        }
    }

    function makeDynElemClickHandler() {
        return function () {
            var dynamicElementId = this.className.split(' ')[0];
            dynamicElements[dynamicElementId].showLink(false);
            dynamicElements[dynamicElementId].followLink();
        };
    }

    function makeDynElemMouseOverHandler() {
        return function () {
            var dynamicElementId = this.className.split(' ')[0];
            dynamicElements[dynamicElementId].showLink(true);
        };
    }

    function makeDynElemMouseOutHandler() {
        return function () {
            var dynamicElementId = this.className.split(' ')[0];
            dynamicElements[dynamicElementId].showLink(false);
        };
    }

    function initTableListener() {
        $(document).click(function (evt) {
            evt = evt || event; // Compatibilité IE
            var target = evt.target || evt.srcElement; // Compatibilité IE

            if (target.nodeName == 'TD') {
                var coord = decodeCellCoord(target.id);

                if (coord) {
                    udcColumnsOrder[coord.col].doCellComment(coord.row, true);
                }
            }
        });
        $(document).keydown(function (evenement) {
            evenement = evenement || event; // Compatibilité IE
            var target = evenement.target || evenement.srcElement; // Compatibilité IE

            var targetName = target.nodeName.toUpperCase();
            var isValidTarget = targetName == 'BODY' || targetName == 'HTML' || targetName == 'TD' || target.id == 'udcTBodyPane';
            if ($("#tabs").tabs("option", "active") === 0 && curYear >= 0 && isValidTarget) {
                var keyCode = evenement.which || evenement.keyCode;
                var year = getDefaultYear();
                var col = getDefaultColumn();
                // Touche "Up"
                if (keyCode == 38 && year > 0) {
                    udcColumnsOrder[col].doCellComment(year - 1, true);
                    if (year > 1) {
                        scrollForShowing(year - 2);
                    } else {
                        scrollForShowing(year - 1);
                    }
                    return false;
                }
                // Touche "Left"
                else if (keyCode == 37 && col > 0) {
                    udcColumnsOrder[col - 1].doCellComment(year, true);
                    return false;
                }
                // Touche "Down"
                else if (keyCode == 40 && year < TOTAL_YEARS_COUNT) {
                    if (year < rowCount - 1) {
                        udcColumnsOrder[col].doCellComment(year + 1, true);
                        scrollForShowing(year + 1);
                    } else {
                        curYear = year + 1;
                        rowCount = curYear + 1;
                        $("#rowSlider").slider("option", "value", rowCount);
                        rowCountChanged();
                    }
                    return false;
                }
                // Touche "Right"
                else if (keyCode == 39 && col < udcColumnsOrder.length - 1) {
                    if (col < columnCount - 1) {
                        udcColumnsOrder[col + 1].doCellComment(year, true);
                    } else {
                        curColumn = col + 1;
                        columnCount = curColumn + 1;
                        $("#columnSlider").slider("option", "value", columnCount);
                        columnCountChanged();
                    }
                    return false;
                }
            }
        });
    }

    // a revoir en jQuery
    // https://stackoverflow.com/questions/1019938/make-tbody-scrollable-in-webkit-browsers/11460752#11460752
    function updateUdcTable(changeCommentPage) {
        // Update THEADER

        var widths = [35, 105, 99, 87, 93, 93, 82, 90];

        var newUdcTHeader = document.createElement('table');
        newUdcTHeader.id = 'udcTHeaderTable';

        var trForHead = document.createElement("tr");
        var thead = newUdcTHeader.createTHead();

        for (var k = 0; k < columnCount; k = k + 1) {
            var th = document.createElement("th");
            th.appendChild(document.createTextNode(udcColumnsOrder[k].name));
            trForHead.appendChild(th);
            th.style.width = widths[k] + 'px';
            //th.style.width = '40px';
            th.style.height = '70px';
        }
        thead.appendChild(trForHead);
        newUdcTHeader.appendChild(thead);

        var curUdcTHeader = document.getElementById('udcTHeaderTable');
        curUdcTHeader.parentNode.replaceChild(newUdcTHeader, curUdcTHeader);

        // Update TBODY

        var newUdcTBody = document.createElement('table');
        newUdcTBody.id = 'udcTBodyTable';
        var tbody = document.createElement("tbody");

        for (var i = 0; i < rowCount; i = i + 1) {
            var trForBody = document.createElement("tr");
            trForBody.id = encodeCellRow(i);
            trForBody.className = (i % 2 === 0) ? "even" : "odd";
            for (var j = 0; j < columnCount; j = j + 1) {
                var td = document.createElement("td");
                td.appendChild(document.createTextNode(formatValue(udcColumnsOrder[j].values[i])));
                td.id = encodeCellCoord(i, j);
                td.className = (i % 2 === 0) ? "even" : "odd";
                td.style.width = widths[j] + 'px';
                //td.style.width = '40px';
                trForBody.appendChild(td);
            }
            tbody.appendChild(trForBody);
        }

        newUdcTBody.appendChild(tbody);
        var curUdcTBody = document.getElementById('udcTBodyTable');
        curUdcTBody.parentNode.replaceChild(newUdcTBody, curUdcTBody);

        if (typeof curColumn === "number" && typeof curYear === "number") {
            udcColumnsOrder[curColumn].doCellComment(curYear, changeCommentPage);
        }
    }

    function updateMainComment(changeCommentPage) {
        var hlType = COLOR_HL;
        clearHighLight();

        showComment('main', changeCommentPage);
        dynamicElements.moneyIncreaseT0.doHighlight(hlType, 0);
        udcForms.t0MoneySupplyForm.doFormHighlight(hlType);
        udcForms.individualNumberForm.doFormHighlight(hlType);
        udcForms.userUdForm.doFormHighlight(hlType);
        dynamicElements.addedRow.doHighlight(hlType);
    }

    function updatePlot1Comment(changeCommentPage) {
        $("#tabs").tabs("option", "active", 1);
        var hlType = COLOR_HL;
        clearHighLight();

        showComment('nothingCloseToEqualPlot', changeCommentPage);

        var year = getDefaultYear();
        dynamicElements.year.doInject(year);
        dynamicElements.year.doHighlight(hlType, year);
        dynamicElements.year.doClassHighlight(hlType);

        dynamicElements.increasePerIndividual.doInject(year);

        dynamicElements.nothingYear0Individual.doInject(year);
        dynamicElements.nothingYear0Individual.doHighlight(hlType, year);

        dynamicElements.nothingYear0IndividualByDU.doInject(year);
        dynamicElements.nothingYear0IndividualByDU.doHighlight(hlType, year);

        dynamicElements.cumulatedIncreasePerIndividual.doInject(year);
        dynamicElements.cumulatedIncreasePerIndividual.doHighlight(NO_HL, year);

        dynamicElements.equalDistribPerIndividual.doInject(year);
        dynamicElements.equalDistribPerIndividual.doHighlight(hlType, year);

        dynamicElements.equalDistribPerIndividualByDU.doInject(year);
        dynamicElements.equalDistribPerIndividualByDU.doHighlight(hlType, year);

        dynamicElements.nothingCumulatedByEqualDistrib.doInject(year);
        dynamicElements.nothingCumulatedByEqualDistrib.doHighlight(hlType, year);

        dynamicElements.naturalT0Money.doInject();
        dynamicElements.naturalT0Money.doHighlight(hlType);

        dynamicElements.scaledT0Money.doInject();
        dynamicElements.scaledT0Money.doHighlight(hlType);
    }

    function updatePieChartComment(changeCommentPage) {
        $("#tabs").tabs("option", "active", 2);
        var hlType = COLOR_HL;
        clearHighLight();

        showComment('oneWithAllMoneyPie', changeCommentPage);

        var year = getDefaultYear();
        dynamicElements.year.doInject(year);
        dynamicElements.year.doHighlight(hlType, year);
        dynamicElements.year.doClassHighlight(COLOR_HL);

        dynamicElements.moneySupply.doInject(year);
        dynamicElements.moneySupply.doHighlight(hlType, year);

        dynamicElements.allYear0Individual.doInject(year);
        dynamicElements.allYear0Individual.doHighlight(hlType, year);

        dynamicElements.allYear0IndividualPerCent.doInject(year);
        dynamicElements.allYear0IndividualPerCent.doHighlight(hlType, year);

        dynamicElements.nothingYear0Individuals.doInject(year);
        dynamicElements.nothingYear0Individuals.doHighlight(hlType, year);

        dynamicElements.nothingYear0IndividualsPerCent.doInject(year);
        dynamicElements.nothingYear0IndividualsPerCent.doHighlight(hlType, year);

        dynamicElements.t0MoneySupply.doInject();
        dynamicElements.t0MoneySupply.doHighlight(hlType);

        dynamicElements.cumulatedIncreasePerIndividual.doInject(year);
        dynamicElements.cumulatedIncreasePerIndividual.doHighlight(hlType, year);

        udcForms.t0MoneySupplyForm.doFormHighlight(hlType);
    }

    $(function () {
        userUdRate = computeUdMax();

        initCommentsAccordion();
        initStep3Tabs();

        initRowSlider();
        initYearSlider("#yearSlider2");
        initYearSlider("#yearSlider3");

        initColumnSlider();
        initT0MoneySlider();

        initFormListeners();

        initTableListener();

        initLinkedListener();

        initValuesInForm();
        updateUdcTableValues();
        updateVisualizedResults();

        commentSelection.main(true);
        initQuantitativePlot1();
        initRelativePlot1();
        initPieChart();
    });

})();