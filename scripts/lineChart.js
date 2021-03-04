function lineChart(){

//--------SETTERS--------

    this.data = function(data){
        if(arguments.length > 0){
            this._data = data;
            return this;
        } else {
            console.error('Please include a dataset')
            return this._data;
        }
    }

    this.selection = function(selection){
        if(arguments.length > 0){
            this._sel = selection;
            return this;
        } else {
            console.error('Please Identify the SVG Selection');
            return this.selection;
        }
    }

    this.size = function(size){
        if(arguments.length > 0){
            this._size = size;

            if(!this._margin){
                this._chartSize = this._size;
                return this;
            }

            this._chartSize = {
                w: this._size.w - this._margin.l - this._margin.r,
                h: this._size.h - this._margin.t - this._margin.b
            };
            return this;

        }else{
            console.error('Please Identify the Canvas Size');
            return this.size;
        }
    }

    this.margin = function(margin){
        if(arguments.length > 0){
            this._margin = margin;
            return this;
        } else {
            console.error('Please Set Margins of the Canvas');
            return this.margin;
        }
    }

    this.dispatch = function(dispatch){
        this._dispatch = dispatch;

        this._dispatch.on('updateChart', (mode, region) => {
            this._filteredData = this._data.filter(d => d[mode] == region);
            this.draw();
        });
        return this;
    }

    this._duration = 600;
    this._delay = 50;
    this._pathColor = ['#6fa1e3', '#f5a4be'];

//--------FUNTIONS--------

    //--------DRAWING CHARTS--------
    this.draw = function(){
        if(!this._filteredData){
            this._filteredData = this._data.filter(d => d.continent == 'Americas');
        }
        let data = this._filteredData;

        //remaping data
        let remappedData = this.remapData(data);

        //creating scales
        let maxValue = d3.max(remappedData.series, d => d3.max(d.values));
        let extent = [0, maxValue];

        let xScale = d3.scaleTime()
            .domain(d3.extent(this._years))
            .range([0, this._chartSize.w]);
        
        let yScale = d3.scaleLinear()
            .domain(extent)
            .range([this._chartSize.h, 0]);

        let pathFn = d3.line()
            .x((d, i) => xScale(remappedData.years[i]))
            .y(d => yScale(d))
            .curve(d3.curveBasis);

        //creating chart
        let path = this._sel.selectAll('.paths')
            .data(remappedData.series, d => d.country);

        path
            .join('path')
            .attr('d', d => pathFn(d.values))
            .attr('class', 'paths')
            .attr('fill', 'none')
            .attr('stroke', d => d.isDeveloped ? this._pathColor[0]: this._pathColor[1])
            .attr('stroke-width', '2px')
            .attr('stroke-dasharray', '0, 1')
            .style("mix-blend-mode", "multiply")
            .transition()
            .duration(this._duration)
            .attrTween('stroke-dasharray', this.dashTween)
            .delay((d, i) => i * this._delay);
        
        this.drawAxes(xScale, yScale);
        this.tooltip();
        this.label();
        this.legends();
    }

    //CREATING AXES
    this.drawAxes = function(xScale, yScale){
        this.drawAxisX(xScale);
        this.drawAxisY(yScale);
    }
    //creating x axis
    this.drawAxisX = function(xScale){
        let axis = d3.axisBottom(xScale)
            .tickFormat(d => +d)
            .tickSize(-this._size.h + 100)
            .tickSizeOuter(0);

        let axisG = this._sel.selectAll('g.axis-x')
            .data([1])
            .join('g')
            .classed('axis', true)
            .classed('axis-x', true);
        
        axisG
            .attr('transform', `translate(0, ${this._chartSize.h})`)
            .transition()
            .duration(this._duration)
            .call(axis);
    }
    //creating y axis
    this.drawAxisY = function(yScale){
        let axis = d3.axisLeft(yScale)
            .tickFormat(d3.format('.2s'));

        let axisG = this._sel.selectAll('g.axis-y')
            .data([1])
            .join('g')
            .classed('axis', true)
            .classed('axis-y', true);
        
        axisG.transition()
            .duration(this._duration)
            .call(axis);
    }

    //APPENDING LABELS
    this.label = function(){
        let labelX = this._sel.selectAll('.label-x').data([1]);
        let labelY = this._sel.selectAll('.label-y').data([1]);

        labelX
            .join('text')
            .classed('label label-x', true)
            .attr('x', this._chartSize.w/2)
            .attr('y', this._chartSize.h + this._margin.b/2)
            .style('dominant-baseline', 'text-before-edge')
            .text('Year');

        labelY
            .join('text')
            .classed('label label-y', true)
            .attr('x', -this._chartSize.h/2)
            .attr('y', -this._margin.l)
            .attr('transform', 'rotate(-90)')
            .style('dominant-baseline', 'text-before-edge')
            .text('Population');
    }

    //APPENDING LEGENDS
    this.legends = function(){
        let place = [this._chartSize.w/2 - 250, this._chartSize.w/2];
        let length = 80;
        let legends = this._sel.selectAll('.legend').data([0,1]);
        let legendTexts = this._sel.selectAll('.legend-text').data(['developed country','developing country']);
        
        legends
            .join('line')
            .classed('legend', true)
            .style('stroke', d => `${this._pathColor[d]}`)
            .style('stroke-width', '2px')
            .attr('x1', d => place[d])
            .attr('y1', -this._margin.t/2)
            .attr('x2', d => place[d] + length)
            .attr('y2', -this._margin.t/2);

        legendTexts
            .join('text')
            .classed('legend-text', true)
            .attr('x', (d, i) => place[i] + length + 10)
            .attr('y', -this._margin.t/2 + 3)
            .text(d => d);
    }

    //LINE ANIMATION, Reference: https://observablehq.com/@mbostock/sea-ice-extent-1978-2017
    this.dashTween = function(){
        let length = this.getTotalLength();
        return d3.interpolate(`0,${length}`, `${length},${length}`);
    }

    //REMAPPING DATA
    this.remapData = function(data) {
        //creating an array of years
        let years = new Set(Object.keys(this._data[0]));

        years = Array.from(years);
        years = years.filter(d => +d)
            .sort((a, b) => +a - +b)
            .map(d => +d);
        
        this._years = years;
        let remappedData = {years:[], series:[]};
        remappedData.years = remappedData.years.concat(years);

        for(d of data){
            let element = {};
            element.continent = d.continent;
            element.country = d.country;
            element.subRegion = d.subRegion;
            element.isDeveloped = d.isDeveloped;
            element.values = [];

            years.forEach(function(y){
                element.values.push(d[y]);
            })
            remappedData.series.push(element);
        }
        return remappedData;
    }

    //CREATING TOOLTIP
    this.tooltip = function() {

        let tooltip = d3.select('.container')
            .append('div')
            .attr('class', 'tooltip');  

        let paths = this._sel.selectAll('.paths').on('mouseover', function(e, d){
            
            tooltip.style('visibility', 'visible')
                .style('left', e.pageX + 15 + 'px')
                .style('top', e.pageY - 20 + 'px')
                .html(`<b>${d.country}</b>`);

            paths.style('opacity', 0.2);

            d3.select(this)
                .style('opacity', 1.0)
                .attr('stroke-width', '3px');

        }).on('mouseout',function(e, d){
            tooltip.style('visibility', 'hidden');
            paths.style('opacity', 1.0)
                .attr('stroke-width', '2px');
        })
    }
}