$(() => {
	var xVals = [];
	var yVals = [];

	var xSeparator = $('[name=xseparator]').val();
	var ySeparator = $('[name=yseparator]').val();
	var round = $('[name=round]').val();

	$('.xvals').on('input', function() {
		// check for empty input field
		if (!$(this).val()) {
			$('.result').text('--');
			$('#raw-data').val('no input');
			$('.error').css('display', 'none');
			return;
		}
		
		//==========================//
		//      PRE-PROCESSING      //
		//==========================//
		
		var sum = 0;
		var sum2 = 0;
		
		// split list to array and get length
		var splitRegExp = new RegExp(ySeparator + '|\n', 'g'); // x separator and new lines
		xVals = $(this).val().split(splitRegExp).filter(x => x.length > 0).map(x => +x);
		var len = xVals.length;
		
		// remove empty indicies, parse nums, calc totals
		for (var i=0; i<len; i++) {
			var val = xVals[i];
			// if array index contains signed int or float
			if (!isNaN(val)) {
				sum += val;
				sum2 += Math.pow(val, 2);
				$('[name=errcheck]').trigger('change', false);
			} else {
				$('[name=errcheck]').trigger('change', true);
				return;
			}
		}
		
		// sort
		$('[name=order]').trigger('change');
		
		//=================//
		//      BASIC      //
		//=================//
		
		setResult($('#length .result'), len);
		setResult($('#sum .result'), sum);
		setResult($('#sum2 .result'), sum2);
		
		//================//
		//      MEAN      //
		//================//
		
		var mean = sum / len;

		setResult($('#mean .result'), mean);
		
		//==================//
		//      MEDIAN      //
		//==================//
		
		var median = 0;
		var medianPos = 0;

		if (len % 2 === 0) {
			median = (xVals[len / 2] + xVals[(len / 2) - 1]) / 2;
			medianPos = (len / 2) + 0.5;
		} else {
			medianPos = (len + 1) / 2;
			median = xVals[medianPos - 1];
		}
		
		setResult($('#median .result'), median);
		setResult($('#medpos .result'), medianPos);
		
		//================//
		//      MODE      //
		//================//
		
		var modeMap = {};
		var mode = xVals[0];
		var maxCount = 1;

		for (i=0; i<len; i++) {
			var currVal = xVals[i];
			
			if (!modeMap[currVal]) {
				modeMap[currVal] = 1;
			} else {
				modeMap[currVal]++;
			}
			
			if (modeMap[currVal] > maxCount) {
				mode = currVal;
				maxCount = modeMap[currVal];
			}
		}
		
		var modeCount = 0;
		for (val in modeMap) {
			if (modeMap[val] === maxCount && len !== 1) {
				modeCount++;
			}
		}
		
		var result = (modeCount === 1 || len === 1) ? mode : 'bimodal';
		setResult($('#mode .result'), result);
		
		//=================//
		//      RANGE      //
		//=================//
		
		var range = xVals[len - 1] - xVals[0] || '--';

		setResult($('#range .result'), range);
		
		//====================//
		//      VARIANCE      //
		//====================//
		
		var variance = (sum2 - (Math.pow(sum, 2) / len)) / (len - 1) || '--';

		setResult($('#variance .result'), variance);
		
		//===================//
		//      STD DEV      //
		//===================//
		
		var stdDev = Math.sqrt(variance) || '--';

		setResult($('#stddev .result'), stdDev);
		
		//================================//
		//      STD DEV RANGE APPROX      //
		//================================//
		
		var stdDevApprox = range / 4 || '--';

		setResult($('#stddevapprox .result'), stdDevApprox);
		
		//=====================//
		//       COVERS        //
		//=====================//
		
		var empRule1Num = 0;
		var empRule2Num = 0;
		var empRule3Num = 0;
		
		for (i=0; i<len; i++) {
			var val = xVals[i];
			if (val > mean - stdDev && val < mean + stdDev) {
				empRule1Num++;
			}
			if (val > mean - (2 * stdDev) && val < mean + (2 * stdDev)) {
				empRule2Num++;
			}
			if (val > mean - (3 * stdDev) && val < mean + (3 * stdDev)) {
				empRule3Num++;
			}
		}
		
		var empRule1Per = (100 / len) * empRule1Num;
		var empRule2Per = (100 / len) * empRule2Num;
		var empRule3Per = (100 / len) * empRule3Num;
		
		setResult($('#emprule1 .result'), empRule1Per, '%');
		setResult($('#emprule2 .result'), empRule2Per, '%');
		setResult($('#emprule3 .result'), empRule3Per, '%');
		
		//=====================//
		//      QUARTILES      //
		//=====================//
		
		var quartile1 = xVals[Math.ceil((len + 1) * 0.25)] || '--';
		var quartile3 = xVals[Math.ceil((len + 1) * 0.75)] || '--';
		var iqr = quartile3 - quartile1 || '--';
		
		setResult($('#quart1 .result'), quartile1);
		setResult($('#quart3 .result'), quartile3);
		setResult($('#iqr .result'), iqr);
		
		//=================//
		//      FENCES     //
		//=================//
		
		var uFence = quartile3 + (1.5 * iqr) || '--';
		var lFence = quartile1 - (1.5 * iqr) || '--';
		
		setResult($('#ufence .result'), uFence);
		setResult($('#lfence .result'), lFence);
		
		//==========================//
		//      POST-PROCESSING     //
		//==========================//
		
		$('#raw-data').val('{' + xVals + '}');
		// console.log('Values: ' + xVals);
	});
	
	// on error checkbox change
	$('[name=errcheck]').on('change', function(event, err) {
		var style = $('.error').css('display');
		
		if ($(this).is(':checked')) {
			var display = err ? 'block' : 'none';
			$('.error').css('display', display);
		} else {
			if (style === 'block') $('.error').css('display', 'none');
		}
	});
	
	// on order radio button change
	$('[name=order]').on('change', function() {
		//check sort option
		if ($('[value=inc]').is(':checked')) {
			xVals.sort((a, b) => a - b); //least to greatest
		} else {
			xVals.sort((a, b) => b - a ); //greatest to least
		}
		
		$('#raw-data').val('{' + xVals + '}');
	});
	
	// on rounding dropdown selection change
	$('[name=round]').on('change', function() {
		round = $(this).val();
		
		if ($('.xvals').val()) {
			$('.xvals').trigger('input');
		}
	});
	
	// cast numbers to floats and remove trailing zeroes
	function roundVal(val) {
		if (val === '--') {
			return '--';
		} else if (round === 'all') {
			return val;
		} else {
			var rounded = parseFloat(val).toFixed(round);
			rounded = rounded.replace(/0+$/g, '').replace(/\.$/g, '');
			return rounded;
		}
	}

	// set result text
	function setResult(el, val, suffix) {
		if (typeof val === 'string') {
			el.text(val);
		} else if (suffix) {
			el.text(roundVal(val) + suffix).data('val', val).attr('title', val + suffix);
		} else {
			el.text(roundVal(val)).data('val', val).attr('title', val);
		}
	}
});