(function d3ChartIIFE() {

	const isInternetExplorer = window.navigator.userAgent.indexOf("MSIE") > -1 || window.navigator.userAgent.indexOf("Trident") > -1 ? true : false;

	const cssLink = "https://cbpfgms.github.io/css/d3chartstyles.css";

	const externalCSS = document.createElement("link");
	externalCSS.setAttribute("rel", "stylesheet");
	externalCSS.setAttribute("type", "text/css");
	externalCSS.setAttribute("href", cssLink);
	document.getElementsByTagName("head")[0].appendChild(externalCSS);

	function loadScript(url, callback) {
		const head = document.getElementsByTagName('head')[0];
		const script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = url;
		script.onreadystatechange = callback;
		script.onload = callback;
		head.appendChild(script);
	}

	if (!isInternetExplorer) {
		loadScript("https://d3js.org/d3.v5.min.js", d3Chart);
	} else {
		loadScript("https://cdn.jsdelivr.net/npm/promise-polyfill@7/dist/polyfill.min.js", function() {
			loadScript("https://cdnjs.cloudflare.com/ajax/libs/fetch/2.0.4/fetch.min.js", function() {
				loadScript("https://d3js.org/d3.v5.min.js", d3Chart);
			});
		});
	};

	function d3Chart() {

		const width = 1130,
			padding = [4, 4, 34, 4],
			linesPanelsHeight = 320,
			panelVerticalPadding = 4,
			panelHorizontalPadding = 4,
			buttonsTitlePadding = 12,
			buttonInternalPadding = 2,
			buttonsBorderRadius = 2,
			buttonMargin = 3,
			buttonsGroupMargin = 20,
			buttonsPanelsPaddings = [28, 4, 2, 32],
			flagSize = 16,
			flagPadding = 2,
			buttonHeight = flagSize,
			circleRadius = 2.5,
			localVariable = d3.local(),
			currentYear = new Date().getFullYear(),
			parseTime = d3.timeParse("%Y"),
			formatSIaxes = d3.format("~s"),
			formatMoney2Decimals = d3.format(",.2f"),
			monthsMargin = 2,
			showFutureGroupPadding = 240,
			labelPadding = 10,
			labelGroupHeight = 14,
			buttonsGroupHeight = (3 * buttonHeight) + (2 * buttonMargin),
			buttonsPanelsHeight = buttonsPanelsPaddings[0] + buttonsPanelsPaddings[2] + (2 * buttonsGroupMargin) + buttonsGroupHeight,
			height = padding[0] + padding[2] + buttonsPanelsHeight + linesPanelsHeight + panelHorizontalPadding,
			windowHeight = window.innerHeight,
			duration = 1000,
			excelIconSize = 20,
			excelIconPath = "https://github.com/CBPFGMS/cbpfgms.github.io/raw/master/img/assets/excelicon.png",
			flagsDirectory = "https://github.com/CBPFGMS/cbpfgms.github.io/raw/master/img/flags16/",
			chartState = {
				selectedDonors: [],
				selectedCbpfs: []
			};

		let started = false,
			maxButtonRows = 0;

		const containerDiv = d3.select("#d3chartcontainerpbicli");

		const distancetoTop = containerDiv.node().offsetTop;

		const selectedResponsiveness = (containerDiv.node().getAttribute("data-responsive") === "true");

		const lazyLoad = (containerDiv.node().getAttribute("data-lazyload") === "true");

		chartState.futureDonations = (containerDiv.node().getAttribute("data-showfuture") === "true");

		if (selectedResponsiveness === false || isInternetExplorer) {
			containerDiv.style("width", width + "px")
				.style("height", height + "px");
		};

		const svg = containerDiv.append("svg")
			.attr("viewBox", "0 0 " + width + " " + height);

		createProgressWheel();

		const tooltip = d3.select("body").append("div")
			.attr("id", "pbiclitooltipdiv")
			.style("display", "none");

		const donorsButtonsPanel = {
			main: svg.append("g")
				.attr("class", "pbicliDonorsButtonsPanel")
				.attr("transform", "translate(" + padding[3] + "," + padding[0] + ")"),
			width: (width - padding[1] - padding[3] - panelVerticalPadding) / 2,
			height: buttonsPanelsHeight,
			padding: buttonsPanelsPaddings
		};

		const cbpfsButtonsPanel = {
			main: svg.append("g")
				.attr("class", "pbicliCbpfsButtonsPanel")
				.attr("transform", "translate(" + (padding[3] + donorsButtonsPanel.width + panelVerticalPadding) +
					"," + padding[0] + ")"),
			width: (width - padding[1] - padding[3] - panelVerticalPadding) / 2,
			height: buttonsPanelsHeight,
			padding: buttonsPanelsPaddings
		};

		const donorsLinesPanel = {
			main: svg.append("g")
				.attr("class", "pbicliDonorsLinesPanel")
				.attr("transform", "translate(" + padding[3] +
					"," + (padding[0] + buttonsPanelsHeight + panelHorizontalPadding) + ")"),
			width: (width - padding[1] - padding[3] - panelVerticalPadding) / 2,
			height: linesPanelsHeight,
			padding: [4, 40, 16, 32]
		};

		const cbpfsLinesPanel = {
			main: svg.append("g")
				.attr("class", "pbicliCbpfsLinesPanel")
				.attr("transform", "translate(" + (padding[3] + donorsButtonsPanel.width + panelVerticalPadding) +
					"," + (padding[0] + buttonsPanelsHeight + panelHorizontalPadding) + ")"),
			width: (width - padding[1] - padding[3] - panelVerticalPadding) / 2,
			height: linesPanelsHeight,
			padding: [4, 40, 16, 32]
		};

		const xScaleDonors = d3.scaleTime()
			.range([donorsLinesPanel.padding[3], donorsLinesPanel.width - donorsLinesPanel.padding[1]]);

		const xScaleCbpfs = d3.scaleTime()
			.range([cbpfsLinesPanel.padding[3], cbpfsLinesPanel.width - cbpfsLinesPanel.padding[1]]);

		const yScaleDonors = d3.scaleLinear()
			.range([donorsLinesPanel.height - donorsLinesPanel.padding[2], donorsLinesPanel.padding[0]]);

		const yScaleCbpfs = d3.scaleLinear()
			.range([cbpfsLinesPanel.height - cbpfsLinesPanel.padding[2], cbpfsLinesPanel.padding[0]]);

		const lineGeneratorDonors = d3.line()
			.x(function(d) {
				return xScaleDonors(parseTime(d.year))
			})
			.y(function(d) {
				return yScaleDonors(d.total)
			});

		const lineGeneratorCbpfs = d3.line()
			.x(function(d) {
				return xScaleCbpfs(parseTime(d.year))
			})
			.y(function(d) {
				return yScaleCbpfs(d.total)
			});

		const xAxisDonors = d3.axisBottom(xScaleDonors)
			.tickSizeInner(4)
			.tickSizeOuter(0);

		const xAxisCbpfs = d3.axisBottom(xScaleCbpfs)
			.tickSizeInner(4)
			.tickSizeOuter(0);

		const yAxisDonors = d3.axisLeft(yScaleDonors)
			.tickSizeInner(2)
			.tickSizeOuter(0)
			.ticks(5)
			.tickFormat(formatSIaxes);

		const yAxisCbpfs = d3.axisLeft(yScaleCbpfs)
			.tickSizeInner(2)
			.tickSizeOuter(0)
			.ticks(5)
			.tickFormat(formatSIaxes);

		d3.csv("https://cbpfapi.unocha.org/vo2/odata/ContributionTotal?$format=csv")
			.then(function(rawData) {

				const data = processData(rawData);

				removeProgressWheel();

				if (!lazyLoad) {
					draw(data);
				} else {
					d3.select(window).on("scroll", checkPosition);
					checkPosition();
				};

				function checkPosition() {
					const amountScrolled = window.pageYOffset;

					if (amountScrolled > ((distancetoTop - windowHeight) + height / 10) &&
						amountScrolled < (distancetoTop + height * 0.9)) {
						if (!started) {
							draw(data);
						}
					};

					if (started) {
						if (amountScrolled < (distancetoTop - windowHeight) ||
							amountScrolled > (distancetoTop + height)) {
							restart();
						}
					};

					//end of checkPosition
				};

				//end of d3.csv
			});

		function draw(data) {

			started = true;

			const timeExtent = setTimeExtent(data.years);

			xScaleDonors.domain(timeExtent);

			xScaleCbpfs.domain(timeExtent);

			const yScaleDomain = setYDomain(data.donors, data.cbpfs);

			yScaleDonors.domain(yScaleDomain);

			yScaleCbpfs.domain(yScaleDomain);

			createDonorsButtons();

			createCbpfsButtons();

			createDonorsLines();

			createCbpfsLines();

			createBottomControls();

			function createDonorsButtons() {

				const donorsButtonsPanelDefs = donorsButtonsPanel.main.append("defs");

				const donorTitle = donorsButtonsPanel.main.append("text")
					.attr("class", "pbicliButtonsTitle")
					.attr("y", donorsButtonsPanel.padding[0] - buttonsTitlePadding)
					.attr("x", donorsButtonsPanel.padding[3])
					.text("Donors");

				const donorsButtonsClipPath = donorsButtonsPanelDefs.append("clipPath")
					.attr("id", "pbicliDonorsButtonsClipPath")
					.append("rect")
					.attr("x", -1)
					.attr("y", -1)
					.attr("width", donorsButtonsPanel.width - donorsButtonsPanel.padding[1] - donorsButtonsPanel.padding[3] + 2)
					.attr("height", buttonsGroupHeight + 2);

				const clipPathGroup = donorsButtonsPanel.main.append("g")
					.attr("class", "pbicliDonorsButtonsClipPathGroup")
					.attr("clip-path", "url(#pbicliDonorsButtonsClipPath)")
					.attr("transform", "translate(" + donorsButtonsPanel.padding[3] + "," +
						(donorsButtonsPanel.padding[0] + buttonsGroupMargin) + ")");

				const donorsButtonsContainer = clipPathGroup.append("g")
					.attr("class", "pbicliDonorsButtonsContainer")
					.attr("transform", "translate(0,0)")
					.style("cursor", "pointer");

				createButtonsGroups(data.donors, "donor", donorsButtonsContainer, donorsButtonsPanel);

				const donorsButtonGroup = donorsButtonsPanel.main.selectAll(".pbicliButtonsGroupdonor");

				const arrowUpGroup = donorsButtonsPanel.main.append("g")
					.attr("class", "pbicliArrowUpGroup")
					.attr("transform", "translate(" + donorsButtonsPanel.padding[3] + "," +
						(donorsButtonsPanel.padding[0] + buttonsGroupMargin - (2 * buttonMargin)) + ")")
					.style("cursor", "pointer")
					.style("pointer-events", "none")
					.style("fill", "#ccc");

				const arrowUp = arrowUpGroup.append("text")
					.attr("class", "pbicliUpArrow")
					.text("\u25b2");

				const arrowUpText = arrowUpGroup.append("text")
					.attr("class", "pbicliArrowText")
					.attr("x", 16)
					.text("More Donors");

				const arrowDownGroup = donorsButtonsPanel.main.append("g")
					.attr("class", "pbicliArrowDownGroup")
					.attr("transform", "translate(" + donorsButtonsPanel.padding[3] + "," +
						(donorsButtonsPanel.padding[0] + buttonsGroupMargin + 10 + (2 * buttonMargin) + buttonsGroupHeight) + ")")
					.style("cursor", "pointer")
					.style("fill", "#666");

				const arrowDown = arrowDownGroup.append("text")
					.attr("class", "pbicliDownArrow")
					.text("\u25bc");

				const arrowDownText = arrowDownGroup.append("text")
					.attr("class", "pbicliArrowText")
					.attr("y", -1)
					.attr("x", 16)
					.text("More Donors");

				arrowUpGroup.on("click", function() {
					arrowUpGroup.style("pointer-events", "none");
					const currentTranslate = parseTransform(donorsButtonsContainer.attr("transform"))[1];
					arrowDownGroup.style("fill", "#666").style("pointer-events", "all");
					donorsButtonsContainer.transition()
						.duration(duration)
						.attr("transform", "translate(0," +
							Math.min(0, (currentTranslate + buttonsGroupHeight + buttonMargin)) + ")")
						.on("end", function() {
							const currentTranslate = parseTransform(donorsButtonsContainer.attr("transform"))[1];
							if (currentTranslate === 0) {
								arrowUpGroup.style("fill", "#ccc")
							} else {
								arrowUpGroup.style("pointer-events", "all");
							}
						});
				});

				arrowDownGroup.on("click", function() {
					arrowDownGroup.style("pointer-events", "none");
					const currentTranslate = parseTransform(donorsButtonsContainer.attr("transform"))[1];
					arrowUpGroup.style("fill", "#666").style("pointer-events", "all");
					donorsButtonsContainer.transition()
						.duration(duration)
						.attr("transform", "translate(0," +
							(Math.min(currentTranslate - buttonsGroupHeight - buttonMargin, buttonsGroupHeight * Math.floor(maxButtonRows / 3))) +
							")")
						.on("end", function() {
							const currentTranslate = parseTransform(donorsButtonsContainer.attr("transform"))[1];
							if (Math.abs(currentTranslate) >= buttonsGroupHeight * Math.floor(maxButtonRows / 3)) {
								arrowDownGroup.style("fill", "#ccc")
							} else {
								arrowDownGroup.style("pointer-events", "all");
							}
						});
				});

				donorsButtonGroup.on("click", function(d) {
						clickedButtons(d, this);
					})
					.on("mouseover", function(d) {
						mouseOverButtons(d, "donor", this);
					})
					.on("mouseout", function(d) {
						mouseOutButtons(d, "donor", this);
					});

				//end of createDonorsButtons
			};

			function createCbpfsButtons() {

				const cbpfTitle = cbpfsButtonsPanel.main.append("text")
					.attr("class", "pbicliButtonsTitle")
					.attr("y", cbpfsButtonsPanel.padding[0] - buttonsTitlePadding)
					.attr("x", cbpfsButtonsPanel.padding[3])
					.text("CBPFs");

				const cbpfsButtonsContainer = cbpfsButtonsPanel.main.append("g")
					.attr("class", "pbicliCbpfsButtonsContainer")
					.attr("transform", "translate(" + cbpfsButtonsPanel.padding[3] + "," +
						(cbpfsButtonsPanel.padding[0] + buttonsGroupMargin) + ")")
					.style("cursor", "pointer");

				createButtonsGroups(data.cbpfs, "cbpf", cbpfsButtonsContainer, cbpfsButtonsPanel);

				const cbpfsButtonGroup = cbpfsButtonsPanel.main.selectAll(".pbicliButtonsGroupcbpf");

				cbpfsButtonGroup.on("click", function(d) {
						clickedButtons(d, this);
					})
					.on("mouseover", function(d) {
						mouseOverButtons(d, "cbpf", this);
					})
					.on("mouseout", function(d) {
						mouseOutButtons(d, "cbpf", this);
					});

				//end of createDonorsButtons
			};

			function createDonorsLines() {

				const xAxisDonorsRightMargin = xScaleDonors(xScaleDonors.domain()[1]) -
					xScaleDonors(d3.timeMonth.offset(xScaleDonors.domain()[1], -monthsMargin));

				const yAxisLabelDonors = donorsLinesPanel.main.append("text")
					.attr("class", "pbicliYAxisLabel")
					.attr("text-anchor", "end")
					.attr("x", donorsLinesPanel.padding[3] - 2)
					.attr("y", donorsLinesPanel.padding[0])
					.text("US$");

				const futureDonationsGroup = donorsLinesPanel.main.append("g")
					.attr("class", "pbicliFutureDonationsGroupDonors")
					.attr("transform", "translate(" + xScaleDonors(parseTime(currentYear)) + ",0)")
					.style("opacity", chartState.futureDonations ? 1 : 0);

				const futureDonationsLine = futureDonationsGroup.append("line")
					.attr("x1", 0)
					.attr("x2", 0)
					.attr("y1", donorsLinesPanel.padding[0])
					.attr("y2", donorsLinesPanel.height - donorsLinesPanel.padding[2])
					.style("stroke-width", "1px")
					.style("stroke", "darkseagreen")
					.style("stroke-dasharray", "4,4");

				const futureDonationsText = futureDonationsGroup.append("text")
					.attr("class", "pbicliFutureDonationsText")
					.text("Future Donations");

				const donorsPanelDefs = donorsLinesPanel.main.append("defs");

				const donorsPanelClipPaths = donorsPanelDefs.append("clipPath")
					.attr("id", "pbicliDonorsPanelClipPaths")
					.append("rect")
					.attr("x", donorsLinesPanel.padding[3])
					.attr("y", donorsLinesPanel.padding[0])
					.attr("height", donorsLinesPanel.height - donorsLinesPanel.padding[2] - donorsLinesPanel.padding[0])
					.attr("width", 0);

				const donorsPanelClipCircles = donorsPanelDefs.append("clipPath")
					.attr("id", "pbicliDonorsPanelClipCircles")
					.append("rect")
					.attr("x", donorsLinesPanel.padding[3])
					.attr("y", donorsLinesPanel.padding[0])
					.attr("height", donorsLinesPanel.height - donorsLinesPanel.padding[2] - donorsLinesPanel.padding[0])
					.attr("width", 0);

				const donorsGroup = donorsLinesPanel.main.selectAll(null)
					.data(data.donors)
					.enter()
					.append("g")
					.attr("class", "pbicliDonorsGroups pbicliLineGroup");

				const path = donorsGroup.append("path")
					.style("fill", "none")
					.style("stroke-width", "1px")
					.attr("class", "pbicliUnselectedPath")
					.attr("clip-path", "url(#pbicliDonorsPanelClipPaths)")
					.attr("d", function(d) {
						return lineGeneratorDonors(d.values)
					});

				const circles = donorsGroup.selectAll(null)
					.data(function(d) {
						return d.values
					})
					.enter()
					.append("circle")
					.attr("r", circleRadius)
					.attr("cx", function(d) {
						return xScaleDonors(parseTime(d.year))
					})
					.attr("cy", function(d) {
						return yScaleDonors(d.total)
					})
					.attr("class", "pbicliUnselectedCircle")
					.attr("clip-path", "url(#pbicliDonorsPanelClipCircles)")
					.style("opacity", 0)
					.each(function(d) {
						d.donor = d3.select(this.parentNode).datum().donor;
					});

				const groupXAxisDonors = donorsLinesPanel.main.append("g")
					.attr("class", "pbicligroupXAxisDonors")
					.attr("transform", "translate(0," + (donorsLinesPanel.height - donorsLinesPanel.padding[2]) + ")");

				const groupYAxisDonors = donorsLinesPanel.main.append("g")
					.attr("class", "pbicligroupYAxisDonors")
					.attr("transform", "translate(" + donorsLinesPanel.padding[3] + ",0)");

				groupXAxisDonors.call(xAxisDonors);

				groupYAxisDonors.call(yAxisDonors);

				groupYAxisDonors.selectAll(".tick")
					.filter(function(d) {
						return d === 0;
					})
					.remove();

				donorsPanelClipPaths.transition()
					.duration(duration)
					.attr("width", donorsLinesPanel.width - donorsLinesPanel.padding[1] - donorsLinesPanel.padding[3] -
						xAxisDonorsRightMargin);

				donorsPanelClipCircles.transition()
					.duration(duration)
					.attr("width", donorsLinesPanel.width - donorsLinesPanel.padding[1] - donorsLinesPanel.padding[3] -
						xAxisDonorsRightMargin + circleRadius);

				const rectOverlayDonors = donorsLinesPanel.main.append("rect")
					.attr("class", "pbicliRectOverlay")
					.attr("x", donorsLinesPanel.padding[3])
					.attr("y", donorsLinesPanel.padding[0])
					.attr("height", donorsLinesPanel.height - donorsLinesPanel.padding[0] - donorsLinesPanel.padding[2])
					.attr("width", donorsLinesPanel.width - donorsLinesPanel.padding[1] - donorsLinesPanel.padding[3])
					.style("fill", "none")
					.attr("pointer-events", "all")
					.on("mousemove", function() {
						mouseMoveRectOverlay("donor", donorsLinesPanel, chartState.selectedDonors, xScaleDonors, yScaleDonors);
					})
					.on("mouseout", function() {
						mouseOutRectOverlay(donorsLinesPanel);
					});

				//end of createDonorsLines
			};

			function createCbpfsLines() {

				const xAxisCbpfsRightMargin = xScaleCbpfs(xScaleCbpfs.domain()[1]) -
					xScaleCbpfs(d3.timeMonth.offset(xScaleCbpfs.domain()[1], -monthsMargin));

				const yAxisLabelCbpfs = cbpfsLinesPanel.main.append("text")
					.attr("class", "pbicliYAxisLabel")
					.attr("text-anchor", "end")
					.attr("x", cbpfsLinesPanel.padding[3] - 2)
					.attr("y", cbpfsLinesPanel.padding[0])
					.text("US$");

				const futureDonationsGroup = cbpfsLinesPanel.main.append("g")
					.attr("class", "pbicliFutureDonationsGroupCbpfs")
					.attr("transform", "translate(" + xScaleCbpfs(parseTime(currentYear)) + ",0)")
					.style("opacity", chartState.futureDonations ? 1 : 0);

				const futureDonationsLine = futureDonationsGroup.append("line")
					.attr("x1", 0)
					.attr("x2", 0)
					.attr("y1", donorsLinesPanel.padding[0])
					.attr("y2", donorsLinesPanel.height - donorsLinesPanel.padding[2])
					.style("stroke-width", "1px")
					.style("stroke", "darkseagreen")
					.style("stroke-dasharray", "4,4");

				const futureDonationsText = futureDonationsGroup.append("text")
					.attr("class", "pbicliFutureDonationsText")
					.text("Future Donations");

				const cbpfsPanelDefs = cbpfsLinesPanel.main.append("defs");

				const cbpfsPanelClipPaths = cbpfsPanelDefs.append("clipPath")
					.attr("id", "pbicliCbpfsPanelClipPaths")
					.append("rect")
					.attr("x", cbpfsLinesPanel.padding[3])
					.attr("y", cbpfsLinesPanel.padding[0])
					.attr("height", cbpfsLinesPanel.height - cbpfsLinesPanel.padding[2] - cbpfsLinesPanel.padding[0])
					.attr("width", 0);

				const cbpfsPanelClipCircles = cbpfsPanelDefs.append("clipPath")
					.attr("id", "pbicliCbpfsPanelClipCircles")
					.append("rect")
					.attr("x", cbpfsLinesPanel.padding[3])
					.attr("y", cbpfsLinesPanel.padding[0])
					.attr("height", cbpfsLinesPanel.height - cbpfsLinesPanel.padding[2] - cbpfsLinesPanel.padding[0])
					.attr("width", 0);

				const cbpfsGroup = cbpfsLinesPanel.main.selectAll(null)
					.data(data.cbpfs)
					.enter()
					.append("g")
					.attr("class", "pbicliCbpfsGroups pbicliLineGroup");

				const path = cbpfsGroup.append("path")
					.style("fill", "none")
					.style("stroke-width", "1px")
					.attr("class", "pbicliUnselectedPath")
					.attr("clip-path", "url(#pbicliCbpfsPanelClipPaths)")
					.attr("d", function(d) {
						return lineGeneratorCbpfs(d.values)
					});

				const circles = cbpfsGroup.selectAll(null)
					.data(function(d) {
						return d.values
					})
					.enter()
					.append("circle")
					.attr("r", circleRadius)
					.attr("cx", function(d) {
						return xScaleCbpfs(parseTime(d.year))
					})
					.attr("cy", function(d) {
						return yScaleCbpfs(d.total)
					})
					.attr("class", "pbicliUnselectedCircle")
					.attr("clip-path", "url(#pbicliCbpfsPanelClipCircles)")
					.style("opacity", 0)
					.each(function(d) {
						d.cbpf = d3.select(this.parentNode).datum().cbpf;
					});

				const groupXAxisCbpfs = cbpfsLinesPanel.main.append("g")
					.attr("class", "pbicligroupXAxisCbpfs")
					.attr("transform", "translate(0," + (cbpfsLinesPanel.height - cbpfsLinesPanel.padding[2]) + ")");

				const groupYAxisCbpfs = cbpfsLinesPanel.main.append("g")
					.attr("class", "pbicligroupYAxisCbpfs")
					.attr("transform", "translate(" + cbpfsLinesPanel.padding[3] + ",0)");

				groupXAxisCbpfs.call(xAxisCbpfs);

				groupYAxisCbpfs.call(yAxisCbpfs);

				groupYAxisCbpfs.selectAll(".tick")
					.filter(function(d) {
						return d === 0;
					})
					.remove();

				cbpfsPanelClipPaths.transition()
					.duration(duration)
					.attr("width", cbpfsLinesPanel.width - cbpfsLinesPanel.padding[1] - cbpfsLinesPanel.padding[3] -
						xAxisCbpfsRightMargin);

				cbpfsPanelClipCircles.transition()
					.duration(duration)
					.attr("width", cbpfsLinesPanel.width - cbpfsLinesPanel.padding[1] - cbpfsLinesPanel.padding[3] -
						xAxisCbpfsRightMargin + circleRadius);

				const rectOverlayCbpfs = cbpfsLinesPanel.main.append("rect")
					.attr("class", "pbicliRectOverlay")
					.attr("x", cbpfsLinesPanel.padding[3])
					.attr("y", cbpfsLinesPanel.padding[0])
					.attr("height", cbpfsLinesPanel.height - cbpfsLinesPanel.padding[0] - cbpfsLinesPanel.padding[2])
					.attr("width", cbpfsLinesPanel.width - cbpfsLinesPanel.padding[1] - cbpfsLinesPanel.padding[3])
					.style("fill", "none")
					.attr("pointer-events", "all")
					.on("mousemove", function() {
						mouseMoveRectOverlay("cbpf", cbpfsLinesPanel, chartState.selectedCbpfs, xScaleCbpfs, yScaleCbpfs);
					})
					.on("mouseout", function() {
						mouseOutRectOverlay(cbpfsLinesPanel);
					});

				//end of createCbpfsLines
			};

			function createBottomControls() {

				const showFutureGroup = svg.append("g")
					.attr("class", "pbicliShowFutureGroup")
					.attr("transform", "translate(" + (width - padding[1] - showFutureGroupPadding) + "," +
						(height - padding[2] / 2) + ")")
					.style("cursor", "pointer")
					.attr("pointer-events", "all");

				const outerCircle = showFutureGroup.append("circle")
					.attr("r", 6)
					.attr("fill", "white")
					.attr("stroke", "darkslategray");

				const innerCircle = showFutureGroup.append("circle")
					.attr("r", 4)
					.attr("fill", chartState.futureDonations ? "darkslategray" : "white");

				const showFutureText = showFutureGroup.append("text")
					.attr("class", "pbicliFutureDonationsTextControl")
					.attr("x", 10)
					.text("Show Future Donations")
					.attr("y", 5);

				const downloadGroup = svg.append("g")
					.attr("class", "pbicliDownloadGroup")
					.attr("transform", "translate(" + (width - padding[1] - excelIconSize - 6) + "," +
						(height - padding[2] / 2) + ")");

				const downloadText = downloadGroup.append("text")
					.attr("class", "pbicliDownloadText")
					.attr("x", -2)
					.attr("text-anchor", "end")
					.style("cursor", "pointer")
					.text("Save data")
					.attr("y", 5);

				const excelIcon = downloadGroup.append("image")
					.style("cursor", "pointer")
					.attr("x", 2)
					.attr("width", excelIconSize + "px")
					.attr("height", excelIconSize + "px")
					.attr("xlink:href", excelIconPath)
					.attr("y", (padding[3] - excelIconSize) / 2);

				showFutureGroup.on("click", function() {

					chartState.futureDonations = !chartState.futureDonations;

					const transition = setTransition(duration);

					innerCircle.attr("fill", chartState.futureDonations ? "darkslategray" : "white");

					const timeExtent = setTimeExtent(data.years);

					xScaleDonors.domain(timeExtent);

					xScaleCbpfs.domain(timeExtent);

					const yScaleDomain = setYDomain(data.donors, data.cbpfs);

					yScaleDonors.domain(yScaleDomain);

					yScaleCbpfs.domain(yScaleDomain);

					donorsLinesPanel.main.select(".pbicliFutureDonationsGroupDonors")
						.transition(transition)
						.attr("transform", "translate(" + xScaleDonors(parseTime(currentYear)) + ",0)")
						.style("opacity", chartState.futureDonations ? 1 : 0);

					cbpfsLinesPanel.main.select(".pbicliFutureDonationsGroupCbpfs")
						.transition(transition)
						.attr("transform", "translate(" + xScaleCbpfs(parseTime(currentYear)) + ",0)")
						.style("opacity", chartState.futureDonations ? 1 : 0);

					const donorsGroups = donorsLinesPanel.main.selectAll(".pbicliLineGroup");

					const cbpfsGroups = cbpfsLinesPanel.main.selectAll(".pbicliLineGroup");

					donorsGroups.selectAll("path")
						.transition(transition)
						.attr("d", function(d) {
							return lineGeneratorDonors(d.values)
						});

					cbpfsGroups.selectAll("path")
						.transition(transition)
						.attr("d", function(d) {
							return lineGeneratorCbpfs(d.values)
						});

					donorsGroups.selectAll("circle")
						.transition(transition)
						.attr("cx", function(d) {
							return xScaleDonors(parseTime(d.year))
						})
						.attr("cy", function(d) {
							return yScaleDonors(d.total)
						});

					cbpfsGroups.selectAll("circle")
						.transition(transition)
						.attr("cx", function(d) {
							return xScaleCbpfs(parseTime(d.year))
						})
						.attr("cy", function(d) {
							return yScaleCbpfs(d.total)
						});

					const xAxisDonorsRightMargin = xScaleDonors(xScaleDonors.domain()[1]) -
						xScaleDonors(d3.timeMonth.offset(xScaleDonors.domain()[1], -monthsMargin));

					const xAxisCbpfsRightMargin = xScaleCbpfs(xScaleCbpfs.domain()[1]) -
						xScaleCbpfs(d3.timeMonth.offset(xScaleCbpfs.domain()[1], -monthsMargin));

					donorsLinesPanel.main.select("#pbicliDonorsPanelClipPaths")
						.select("rect")
						.attr("width", donorsLinesPanel.width - donorsLinesPanel.padding[1] - donorsLinesPanel.padding[3] -
							xAxisDonorsRightMargin);

					cbpfsLinesPanel.main.select("#pbicliCbpfsPanelClipPaths")
						.select("rect")
						.attr("width", cbpfsLinesPanel.width - cbpfsLinesPanel.padding[1] - cbpfsLinesPanel.padding[3] -
							xAxisCbpfsRightMargin);

					donorsLinesPanel.main.select("#pbicliDonorsPanelClipCircles")
						.select("rect")
						.attr("width", donorsLinesPanel.width - donorsLinesPanel.padding[1] - donorsLinesPanel.padding[3] -
							xAxisDonorsRightMargin + circleRadius);

					cbpfsLinesPanel.main.select("#pbicliCbpfsPanelClipCircles")
						.select("rect")
						.attr("width", cbpfsLinesPanel.width - cbpfsLinesPanel.padding[1] - cbpfsLinesPanel.padding[3] -
							xAxisCbpfsRightMargin + circleRadius);

					redrawLineGraph("donor");

					redrawLineGraph("cbpf");

					donorsLinesPanel.main.select(".pbicligroupXAxisDonors")
						.transition(transition)
						.call(xAxisDonors);

					donorsLinesPanel.main.select(".pbicligroupYAxisDonors")
						.transition(transition)
						.call(yAxisDonors);

					cbpfsLinesPanel.main.select(".pbicligroupXAxisCbpfs")
						.transition(transition)
						.call(xAxisCbpfs);

					cbpfsLinesPanel.main.select(".pbicligroupYAxisCbpfs")
						.transition(transition)
						.call(yAxisCbpfs);

				});

				downloadGroup.on("click", function() {

					//CODE HERE

				});

				//end of createBottomControls
			};

			function mouseOverButtons(datum, type, self) {

				if (datum.clicked) return;

				if (type === "donor") {
					chartState.selectedDonors.push(datum.donor)
				} else {
					chartState.selectedCbpfs.push(datum.cbpf)
				};

				d3.select(self).select("rect")
					.style("fill", "gainsboro")
					.style("stroke", "#000");

				redrawLineGraph(type);

				//end of mouseOverButtons
			};

			function mouseOutButtons(datum, type, self) {

				if (datum.clicked) return;

				if (type === "donor") {
					const index = chartState.selectedDonors.indexOf(datum.donor);
					chartState.selectedDonors.splice(index, 1);
				} else {
					const index = chartState.selectedCbpfs.indexOf(datum.cbpf);
					chartState.selectedCbpfs.splice(index, 1);
				};

				d3.select(self).select("rect")
					.style("fill", "white")
					.style("stroke", "#444");

				redrawLineGraph(type);

				//end of mouseOutButtons
			};

			function mouseMoveRectOverlay(type, thisPanel, thisSelectedArray, xScale, yScale) {

				if (!thisSelectedArray.length) return;

				const circleClass = type === "donor" ? "contributionColorStroke" : "allocationColorStroke";

				const spanClass = type === "donor" ? "contributionColorHTMLcolor" : "allocationColorHTMLcolor";

				const mouse = d3.mouse(thisPanel.main.node());

				const mouseYear = xScale.invert(mouse[0]).getFullYear().toString();

				const thisData = [];

				thisSelectedArray.forEach(function(country) {
					const thisCountry = data[type + "s"].find(function(e) {
						return e[type] === country;
					});
					const thisYear = thisCountry.values.find(function(e) {
						return e.year === mouseYear;
					});
					if (thisYear) {
						thisData.push({
							name: country,
							total: thisYear.total,
							year: mouseYear
						})
					};
				});

				thisData.sort(function(a, b) {
					return b.total - a.total;
				});

				if (thisData.length) {

					const typeTitle = thisData.length > 1 ?
						type.charAt(0).toUpperCase() + type.slice(1) + "s" :
						type.charAt(0).toUpperCase() + type.slice(1);

					let tooltipHtml = "<span style='margin-bottom:-8px;display:block;'>" + typeTitle + " in <strong>" + mouseYear +
						"</strong>:</span><br><div style='margin:0px;display:flex;flex-wrap:wrap;align-items:flex-end;width:232px;'>";

					for (let i = 0; i < thisData.length; i++) {
						tooltipHtml += "<div style='display:flex;flex:0 50%;'>&bull; " +
							thisData[i].name + ":</div><div style='display:flex;flex:0 50%;justify-content:flex-end;'><span class='" +
							spanClass + "'>$" + formatMoney2Decimals(thisData[i].total) +
							"</span></div>"
					};

					tooltipHtml += "</div>";

					const tooltipGroup = thisPanel.main.selectAll(".pbicliTooltipGroup")
						.data([true]);

					const tooltipGroupEnter = tooltipGroup.enter()
						.append("g")
						.attr("class", "pbicliTooltipGroup")
						.attr("pointer-events", "none");

					const circles = tooltipGroup.selectAll(".pbicliTooltipCircles")
						.data(thisData, function(d) {
							return d.name
						});

					const circlesExit = circles.exit().remove();

					const circlesEnter = circles.enter()
						.append("circle")
						.attr("class", "pbicliTooltipCircles")
						.attr("r", circleRadius + 2)
						.style("fill", "none")
						.classed(circleClass, true)
						.merge(circles)
						.attr("cx", function(d) {
							return xScale(parseTime(d.year))
						})
						.attr("cy", function(d) {
							return yScale(d.total)
						});

					const lines = tooltipGroup.selectAll(".pbicliTooltipLines")
						.data(thisData, function(d) {
							return d.name
						});

					const linesExit = lines.exit().remove();

					const linesEnter = lines.enter()
						.append("line")
						.attr("class", "pbicliTooltipLines")
						.style("stroke-dasharray", "1,1")
						.style("stroke-width", "1px")
						.style("stroke", "#222")
						.merge(lines)
						.attr("x1", function(d) {
							return xScale(parseTime(d.year)) - circleRadius - 2;
						})
						.attr("x2", thisPanel.padding[3])
						.attr("y1", function(d) {
							return yScale(d.total)
						})
						.attr("y2", function(d) {
							return yScale(d.total)
						});

					tooltip.style("display", "block");

					const tooltipSize = tooltip.node().getBoundingClientRect();

					tooltip.html(tooltipHtml)
						.style("top", d3.event.pageY - (tooltipSize.height / 2) + "px")
						.style("left", mouse[0] > thisPanel.width - 16 - tooltipSize.width && type === "cbpf" ?
							d3.event.pageX - tooltipSize.width - 16 + "px" :
							d3.event.pageX + 16 + "px");

				} else {

					tooltip.style("display", "none");
					thisPanel.main.select(".pbicliTooltipGroup").remove();

				};

				//end of mouseOverRectOverlay
			};

			function mouseOutRectOverlay(thisPanel) {
				tooltip.style("display", "none");
				thisPanel.main.select(".pbicliTooltipGroup").remove();
			};

			function clickedButtons(datum, self) {

				datum.clicked = !datum.clicked;

				if (datum.clicked) {
					d3.select(self).select("rect")
						.style("fill", "gainsboro")
						.style("stroke", "#000");
				} else {
					d3.select(self).select("rect")
						.style("fill", "white")
						.style("stroke", "#444");
				};

				//end of clickedButtons
			};

			function redrawLineGraph(type) {

				const thisSelectedArray = type === "donor" ? chartState.selectedDonors : chartState.selectedCbpfs;

				const thisPanel = type === "donor" ? donorsLinesPanel : cbpfsLinesPanel;

				const selectedPathClass = type === "donor" ? "contributionColorStroke" : "allocationColorStroke";

				const selectedCircleClass = type === "donor" ? "contributionColorFill" : "allocationColorFill";

				const yScale = type === "donor" ? yScaleDonors : yScaleCbpfs;

				const xScale = type === "donor" ? xScaleDonors : xScaleCbpfs;

				const selectedGroups = thisPanel.main.selectAll(".pbicliLineGroup")
					.filter(function(d) {
						return thisSelectedArray.indexOf(d[type]) > -1;
					});

				const unselectedGroups = thisPanel.main.selectAll(".pbicliLineGroup")
					.filter(function(d) {
						return thisSelectedArray.indexOf(d[type]) === -1;
					});

				selectedGroups.selectAll("path")
					.attr("class", selectedPathClass)
					.style("stroke-width", "2px");

				selectedGroups.selectAll("circle")
					.attr("class", selectedCircleClass)
					.style("opacity", function(d) {
						return d.total === 0 ? 0 : 1;
					});

				selectedGroups.raise();

				unselectedGroups.selectAll("path")
					.attr("class", "pbicliUnselectedPath")
					.style("stroke-width", "1px");

				unselectedGroups.selectAll("circle")
					.attr("class", "pbicliUnselectedCircle")
					.style("opacity", 0);

				let labelsGroup = thisPanel.main.selectAll(".labelsGroup")
					.data(thisSelectedArray.map(function(d) {
						const thisCountry = data[type + "s"].find(function(e) {
							return e[type] === d;
						});
						let thisDatum;
						if (chartState.futureDonations) {
							thisDatum = thisCountry.values[thisCountry.values.length - 1];
						} else {
							const filteredCountry = thisCountry.values.filter(function(e) {
								return e.year <= currentYear.toString();
							});
							thisDatum = filteredCountry[filteredCountry.length - 1];
						};
						return {
							name: thisCountry.isoCode.toUpperCase(),
							datum: thisDatum
						};
					}), function(d) {
						return d.name;
					});

				const labelsGroupExit = labelsGroup.exit().remove();

				const labelsGroupEnter = labelsGroup.enter()
					.append("g")
					.attr("class", "labelsGroup");

				labelsGroupEnter.attr("transform", function(d) {
					d.yPos = yScale(d.datum.total);
					return "translate(" + (thisPanel.width - thisPanel.padding[1] + labelPadding) + "," +
						d.yPos + ")";
				});

				const labelText = labelsGroupEnter.append("text")
					.attr("class", "pbicliLabelText")
					.attr("y", 4)
					.text(function(d) {
						return isoAlpha2to3[d.name] ? isoAlpha2to3[d.name] : d.name;
					});

				const labelLine = labelsGroupEnter.append("polyline")
					.style("stroke-width", "1px")
					.style("stroke", "#222")
					.style("fill", "none")
					.attr("points", function(d) {
						return (xScale(parseTime(d.datum.year)) - (thisPanel.width - thisPanel.padding[1] + labelPadding) + 5) + ",0 " +
							(xScale(parseTime(d.datum.year)) - (thisPanel.width - thisPanel.padding[1] + labelPadding) + 5) + ",0 " +
							(xScale(parseTime(d.datum.year)) - (thisPanel.width - thisPanel.padding[1] + labelPadding) + 5) + ",0 " +
							(xScale(parseTime(d.datum.year)) - (thisPanel.width - thisPanel.padding[1] + labelPadding) + 5) + ",0"
					});

				labelsGroup.each(function(d) {
					d.yPos = localVariable.get(this);
				});

				labelsGroup = labelsGroupEnter.merge(labelsGroup);

				labelsGroup.raise();

				collideLabels(labelsGroup.data(), thisPanel.height - thisPanel.padding[2]);

				labelsGroup.attr("transform", function(d) {
						return "translate(" + (thisPanel.width - thisPanel.padding[1] + labelPadding) + "," +
							d.yPos + ")";
					})
					.each(function(d) {
						localVariable.set(this, d.yPos);
					});

				labelsGroup.select("text").text(function(d) {
					return isoAlpha2to3[d.name] ? isoAlpha2to3[d.name] : d.name;
				});

				labelsGroup.select("polyline")
					.attr("points", function(d, i) {
						if (!chartState.futureDonations) {
							return (xScale(parseTime(d.datum.year)) - (thisPanel.width - thisPanel.padding[1] + labelPadding) + 5) +
								"," + (yScale(d.datum.total) - d.yPos) + " " +
								-labelPadding + "," + (yScale(d.datum.total) - d.yPos) + " " +
								-labelPadding + "," + 0 + " " +
								-labelPadding / 2 + "," + 0;
						} else {
							return (xScale(parseTime(d.datum.year)) - (thisPanel.width - thisPanel.padding[1] + labelPadding) + 5) +
								"," + (yScale(d.datum.total) - d.yPos) + " " +
								-(labelPadding + i * 2) + "," + (yScale(d.datum.total) - d.yPos) + " " +
								-(labelPadding + i * 2) + "," + 0 + " " +
								-labelPadding / 2 + "," + 0;
						}
					});

				thisPanel.main.select(".pbicliRectOverlay").raise();

				//end of redrawLineGraph
			};

			function createButtonsGroups(buttonsData, countryType, container, thisPanel) {

				buttonsData.sort(function(a, b) {
					return b.total - a.total;
				});

				let row = 0,
					rowWidth = 0;

				const buttonsGroup = container.selectAll(null)
					.data(buttonsData)
					.enter()
					.append("g")
					.attr("class", "pbicliButtonsGroup" + countryType)
					.style("cursor", "pointer")
					.attr("pointer-events", "all");

				const buttonsText = buttonsGroup.append("text")
					.attr("class", "pbicliButtonsText")
					.attr("x", buttonInternalPadding)
					.attr("y", buttonHeight - 2 * buttonInternalPadding)
					.attr("pointer-events", "none")
					.text(function(d) {
						return d[countryType];
					});

				const buttonsRect = buttonsGroup.append("rect")
					.attr("class", "pbicliButtonsRect")
					.attr("x", 0)
					.attr("y", 0)
					.attr("height", buttonHeight)
					.attr("width", function() {
						const thisTextLength = Math.ceil(this.previousSibling.getComputedTextLength());
						localVariable.set(this.parentNode, thisTextLength);
						return countryType === "donor" ?
							thisTextLength + 2 * buttonInternalPadding + flagSize + flagPadding :
							thisTextLength + 2 * buttonInternalPadding;
					})
					.style("fill", "white")
					.style("stroke", "#444")
					.style("stroke-width", "1px")
					.attr("rx", buttonsBorderRadius)
					.attr("ry", buttonsBorderRadius)
					.lower();

				if (countryType === "donor") {
					const buttonsFlag = buttonsGroup.append("image")
						.attr("pointer-events", "none")
						.attr("width", flagSize)
						.attr("height", flagSize)
						.attr("y", 0)
						.attr("x", function() {
							return localVariable.get(this) + 2 * flagPadding;
						})
						.attr("xlink:href", function(d) {
							if (!d.isoCode) d.isoCode = "blank";
							if (d[countryType] === "UNOCHA") d.isoCode = "un";
							return flagsDirectory + d.isoCode + ".png";
						});
				};

				buttonsGroup.each(function() {
					const thisWidth = this.getBoundingClientRect().width;
					if (rowWidth + thisWidth + buttonMargin > thisPanel.width - thisPanel.padding[3] - thisPanel.padding[1]) {
						row += 1;
						rowWidth = 0;
					};
					d3.select(this).attr("transform", "translate(" + rowWidth + "," +
						(row * (buttonHeight + buttonMargin)) + ")");
					rowWidth += (thisWidth + buttonMargin);
				});

				if (countryType === "donor") maxButtonRows = row;

				//end of createButtonsGroup
			};

			//end of draw
		};

		function setTimeExtent(yearsArray) {

			if (!chartState.futureDonations) {
				yearsArray = yearsArray.filter(function(d) {
					return d <= currentYear;
				});
			};

			const timeExtent = d3.extent(yearsArray.map(function(d) {
				return parseTime(d);
			}));

			timeExtent[0] = d3.timeMonth.offset(timeExtent[0], -monthsMargin);

			timeExtent[1] = d3.timeMonth.offset(timeExtent[1], monthsMargin);

			return timeExtent;

			//end of setTimeExtent
		};

		function setYDomain(donors, cbpfs) {

			const maxDonors = d3.max(donors, function(donor) {
				return d3.max(donor.values, function(d) {
					if (!chartState.futureDonations && +d.year > +currentYear) {
						return 0;
					} else {
						return d.total;
					};
				});
			});

			const maxCbpfs = d3.max(cbpfs, function(cbpf) {
				return d3.max(cbpf.values, function(d) {
					if (!chartState.futureDonations && +d.year > +currentYear) {
						return 0;
					} else {
						return d.total;
					};
				});
			});

			return [0, Math.max(maxDonors, maxCbpfs) * 1.05];

			//end of setYDomain
		};

		function collideLabels(dataArray, maxValue) {

			if (dataArray.length < 2) return;

			dataArray.sort(function(a, b) {
				return b.yPos - a.yPos;
			});

			for (let i = 0; i < dataArray.length - 1; i++) {
				if (!isColliding(dataArray[i], dataArray[i + 1])) continue;
				while (isColliding(dataArray[i], dataArray[i + 1])) {
					if (i === 0) {
						dataArray[i].yPos = Math.min(maxValue, dataArray[i].yPos + 1);
						dataArray[i + 1].yPos -= 1;
					} else {
						dataArray[i + 1].yPos -= 1;
					};
				};
			};

			function isColliding(objA, objB) {
				return !((objA.yPos + labelGroupHeight) < objB.yPos ||
					objA.yPos > (objB.yPos + labelGroupHeight));
			};

			//end of collideLabels
		};

		function setTransition(duration) {
			return d3.transition().duration(duration);
		};

		function processData(rawData) {

			rawData.sort(function(a, b) {
				return (+a.FiscalYear) - (+b.FiscalYear);
			});

			const data = {
				years: [],
				donors: [],
				cbpfs: []
			};

			rawData.forEach(function(d) {

				if (data.years.indexOf(d.FiscalYear) === -1) {
					data.years.push(d.FiscalYear);
				};

				const foundDonor = data.donors.find(function(e) {
					return e.donor === d.GMSDonorName;
				});

				const foundCbpf = data.cbpfs.find(function(e) {
					return e.cbpf === d.PooledFundName;
				});

				if (foundDonor) {

					const foundValue = foundDonor.values.find(function(e) {
						return e.year === d.FiscalYear;
					});

					if (foundValue) {
						foundValue.paid += +d.PaidAmt;
						foundValue.pledge += +d.PledgeAmt;
						foundValue.total += (+d.PaidAmt) + (+d.PledgeAmt);
					} else {
						foundDonor.values.push({
							year: d.FiscalYear,
							paid: +d.PaidAmt,
							pledge: +d.PledgeAmt,
							total: (+d.PaidAmt) + (+d.PledgeAmt)
						});
					};

					foundDonor.total += (+d.PaidAmt) + (+d.PledgeAmt);

				} else {

					data.donors.push({
						donor: d.GMSDonorName,
						isoCode: d.GMSDonorISO2Code.toLowerCase(),
						total: (+d.PaidAmt) + (+d.PledgeAmt),
						clicked: false,
						values: [{
							year: d.FiscalYear,
							paid: +d.PaidAmt,
							pledge: +d.PledgeAmt,
							total: (+d.PaidAmt) + (+d.PledgeAmt)
						}]
					});

				};

				if (foundCbpf) {

					const foundValue = foundCbpf.values.find(function(e) {
						return e.year === d.FiscalYear;
					});

					if (foundValue) {
						foundValue.paid += +d.PaidAmt;
						foundValue.pledge += +d.PledgeAmt;
						foundValue.total += (+d.PaidAmt) + (+d.PledgeAmt);
					} else {
						foundCbpf.values.push({
							year: d.FiscalYear,
							paid: +d.PaidAmt,
							pledge: +d.PledgeAmt,
							total: (+d.PaidAmt) + (+d.PledgeAmt)
						});
					};

					foundCbpf.total += (+d.PaidAmt) + (+d.PledgeAmt);

				} else {

					data.cbpfs.push({
						cbpf: d.PooledFundName,
						isoCode: d.PooledFundISO2Code.toLowerCase(),
						total: (+d.PaidAmt) + (+d.PledgeAmt),
						clicked: false,
						values: [{
							year: d.FiscalYear,
							paid: +d.PaidAmt,
							pledge: +d.PledgeAmt,
							total: (+d.PaidAmt) + (+d.PledgeAmt)
						}]
					});

				};

			});

			data.donors.forEach(function(donor) {
				fillZeros(donor.values);
			});

			data.cbpfs.forEach(function(cbpf) {
				fillZeros(cbpf.values);
			});

			const macedoniaObject = data.donors.find(function(d) {
				return d.donor.indexOf("Macedonia") > -1;
			});

			if (macedoniaObject) macedoniaObject.donor = "Macedonia";

			function fillZeros(valuesArray) {
				const firstYear = valuesArray[0].year;
				const lastYear = valuesArray[valuesArray.length - 1].year;
				const thisRange = d3.range(+firstYear, +lastYear, 1);
				thisRange.forEach(function(rangeYear) {
					const foundYear = valuesArray.find(function(e) {
						return e.year === rangeYear.toString();
					});
					if (!foundYear) {
						valuesArray.push({
							year: rangeYear.toString(),
							paid: 0,
							pledge: 0,
							total: 0
						});
					};
				});
				valuesArray.sort(function(a, b) {
					return (+a.year) - (+b.year);
				});
			};

			return data;

			//end of processData
		};

		function restart() {
			started = false;
			const all = svg.selectAll(".pbicliDonorsButtonsPanel, .pbicliCbpfsButtonsPanel, .pbicliDonorsLinesPanel, .pbicliCbpfsLinesPanel")
				.selectAll("*");
			all.interrupt();
			all.remove();
		};

		function parseTransform(translate) {
			const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
			group.setAttributeNS(null, "transform", translate);
			const matrix = group.transform.baseVal.consolidate().matrix;
			return [matrix.e, matrix.f];
		};

		function createProgressWheel() {
			const wheelGroup = svg.append("g")
				.attr("class", "gmslpgwheelGroup")
				.attr("transform", "translate(" + width / 2 + "," + height / 4 + ")");

			const arc = d3.arc()
				.outerRadius(30)
				.innerRadius(25);

			const wheel = wheelGroup.append("path")
				.datum({
					startAngle: 0,
					endAngle: 0
				})
				.classed("contributionColorFill", true)
				.attr("d", arc);

			transitionIn();

			function transitionIn() {
				wheel.transition()
					.duration(1000)
					.attrTween("d", function(d) {
						const interpolate = d3.interpolate(0, Math.PI * 2);
						return function(t) {
							d.endAngle = interpolate(t);
							return arc(d)
						}
					})
					.on("end", transitionOut)
			};

			function transitionOut() {
				wheel.transition()
					.duration(1000)
					.attrTween("d", function(d) {
						const interpolate = d3.interpolate(0, Math.PI * 2);
						return function(t) {
							d.startAngle = interpolate(t);
							return arc(d)
						}
					})
					.on("end", function(d) {
						d.startAngle = 0;
						transitionIn()
					})
			};

			//end of createProgressWheel
		};

		function removeProgressWheel() {
			const wheelGroup = d3.select(".gmslpgwheelGroup");
			wheelGroup.select("path").interrupt();
			wheelGroup.remove();
		};

		//end of d3Chart
	};

	//POLYFILLS

	//Array.prototype.find()

	if (!Array.prototype.find) {
		Object.defineProperty(Array.prototype, 'find', {
			value: function(predicate) {
				if (this == null) {
					throw new TypeError('"this" is null or not defined');
				}
				var o = Object(this);
				var len = o.length >>> 0;
				if (typeof predicate !== 'function') {
					throw new TypeError('predicate must be a function');
				}
				var thisArg = arguments[1];
				var k = 0;
				while (k < len) {
					var kValue = o[k];
					if (predicate.call(thisArg, kValue, k, o)) {
						return kValue;
					}
					k++;
				}
				return undefined;
			},
			configurable: true,
			writable: true
		});
	};

	//Math.log10

	Math.log10 = Math.log10 || function(x) {
		return Math.log(x) * Math.LOG10E;
	};

	//END OF POLYFILLS

	const isoAlpha2to3 = {
		AF: 'AFG',
		AX: 'ALA',
		AL: 'ALB',
		DZ: 'DZA',
		AS: 'ASM',
		AD: 'AND',
		AO: 'AGO',
		AI: 'AIA',
		AQ: 'ATA',
		AG: 'ATG',
		AR: 'ARG',
		AM: 'ARM',
		AW: 'ABW',
		AU: 'AUS',
		AT: 'AUT',
		AZ: 'AZE',
		BS: 'BHS',
		BH: 'BHR',
		BD: 'BGD',
		BB: 'BRB',
		BY: 'BLR',
		BE: 'BEL',
		BZ: 'BLZ',
		BJ: 'BEN',
		BM: 'BMU',
		BT: 'BTN',
		BO: 'BOL',
		BA: 'BIH',
		BW: 'BWA',
		BV: 'BVT',
		BR: 'BRA',
		VG: 'VGB',
		IO: 'IOT',
		BN: 'BRN',
		BG: 'BGR',
		BF: 'BFA',
		BI: 'BDI',
		KH: 'KHM',
		CM: 'CMR',
		CA: 'CAN',
		CV: 'CPV',
		KY: 'CYM',
		CF: 'CAF',
		TD: 'TCD',
		CL: 'CHL',
		CN: 'CHN',
		HK: 'HKG',
		MO: 'MAC',
		CX: 'CXR',
		CC: 'CCK',
		CO: 'COL',
		KM: 'COM',
		CG: 'COG',
		CD: 'COD',
		CK: 'COK',
		CR: 'CRI',
		CI: 'CIV',
		HR: 'HRV',
		CU: 'CUB',
		CY: 'CYP',
		CZ: 'CZE',
		DK: 'DNK',
		DJ: 'DJI',
		DM: 'DMA',
		DO: 'DOM',
		EC: 'ECU',
		EG: 'EGY',
		SV: 'SLV',
		GQ: 'GNQ',
		ER: 'ERI',
		EE: 'EST',
		ET: 'ETH',
		FK: 'FLK',
		FO: 'FRO',
		FJ: 'FJI',
		FI: 'FIN',
		FR: 'FRA',
		GF: 'GUF',
		PF: 'PYF',
		TF: 'ATF',
		GA: 'GAB',
		GM: 'GMB',
		GE: 'GEO',
		DE: 'DEU',
		GH: 'GHA',
		GI: 'GIB',
		GR: 'GRC',
		GL: 'GRL',
		GD: 'GRD',
		GP: 'GLP',
		GU: 'GUM',
		GT: 'GTM',
		GG: 'GGY',
		GN: 'GIN',
		GW: 'GNB',
		GY: 'GUY',
		HT: 'HTI',
		HM: 'HMD',
		VA: 'VAT',
		HN: 'HND',
		HU: 'HUN',
		IS: 'ISL',
		IN: 'IND',
		ID: 'IDN',
		IR: 'IRN',
		IQ: 'IRQ',
		IE: 'IRL',
		IM: 'IMN',
		IL: 'ISR',
		IT: 'ITA',
		JM: 'JAM',
		JP: 'JPN',
		JE: 'JEY',
		JO: 'JOR',
		KZ: 'KAZ',
		KE: 'KEN',
		KI: 'KIR',
		KP: 'PRK',
		KR: 'KOR',
		KW: 'KWT',
		KG: 'KGZ',
		LA: 'LAO',
		LV: 'LVA',
		LB: 'LBN',
		LS: 'LSO',
		LR: 'LBR',
		LY: 'LBY',
		LI: 'LIE',
		LT: 'LTU',
		LU: 'LUX',
		MK: 'MKD',
		MG: 'MDG',
		MW: 'MWI',
		MY: 'MYS',
		MV: 'MDV',
		ML: 'MLI',
		MT: 'MLT',
		MH: 'MHL',
		MQ: 'MTQ',
		MR: 'MRT',
		MU: 'MUS',
		YT: 'MYT',
		MX: 'MEX',
		FM: 'FSM',
		MD: 'MDA',
		MC: 'MCO',
		MN: 'MNG',
		ME: 'MNE',
		MS: 'MSR',
		MA: 'MAR',
		MZ: 'MOZ',
		MM: 'MMR',
		NA: 'NAM',
		NR: 'NRU',
		NP: 'NPL',
		NL: 'NLD',
		AN: 'ANT',
		NC: 'NCL',
		NZ: 'NZL',
		NI: 'NIC',
		NE: 'NER',
		NG: 'NGA',
		NU: 'NIU',
		NF: 'NFK',
		MP: 'MNP',
		NO: 'NOR',
		OM: 'OMN',
		PK: 'PAK',
		PW: 'PLW',
		PS: 'PSE',
		PA: 'PAN',
		PG: 'PNG',
		PY: 'PRY',
		PE: 'PER',
		PH: 'PHL',
		PN: 'PCN',
		PL: 'POL',
		PT: 'PRT',
		PR: 'PRI',
		QA: 'QAT',
		RE: 'REU',
		RO: 'ROU',
		RU: 'RUS',
		RW: 'RWA',
		BL: 'BLM',
		SH: 'SHN',
		KN: 'KNA',
		LC: 'LCA',
		MF: 'MAF',
		PM: 'SPM',
		VC: 'VCT',
		WS: 'WSM',
		SM: 'SMR',
		ST: 'STP',
		SA: 'SAU',
		SN: 'SEN',
		RS: 'SRB',
		SC: 'SYC',
		SL: 'SLE',
		SG: 'SGP',
		SK: 'SVK',
		SI: 'SVN',
		SB: 'SLB',
		SO: 'SOM',
		ZA: 'ZAF',
		GS: 'SGS',
		SS: 'SSD',
		ES: 'ESP',
		LK: 'LKA',
		SD: 'SDN',
		SR: 'SUR',
		SJ: 'SJM',
		SZ: 'SWZ',
		SE: 'SWE',
		CH: 'CHE',
		SY: 'SYR',
		TW: 'TWN',
		TJ: 'TJK',
		TZ: 'TZA',
		TH: 'THA',
		TL: 'TLS',
		TG: 'TGO',
		TK: 'TKL',
		TO: 'TON',
		TT: 'TTO',
		TN: 'TUN',
		TR: 'TUR',
		TM: 'TKM',
		TC: 'TCA',
		TV: 'TUV',
		UG: 'UGA',
		UA: 'UKR',
		AE: 'ARE',
		GB: 'GBR',
		US: 'USA',
		UM: 'UMI',
		UY: 'URY',
		UZ: 'UZB',
		VU: 'VUT',
		VE: 'VEN',
		VN: 'VNM',
		VI: 'VIR',
		WF: 'WLF',
		EH: 'ESH',
		YE: 'YEM',
		ZM: 'ZMB',
		ZW: 'ZWE'
	};

	//end of d3ChartIIFE
}());