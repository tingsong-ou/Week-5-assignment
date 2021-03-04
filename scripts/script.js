const margins = {t: 50, r: 50, b: 50, l: 70};
const width = document.querySelector('svg').clientWidth;
const height = document.querySelector('svg').clientHeight;
const SVGsize = {w: width, h: height};

const svg = d3.select('svg')
    .attr('width', SVGsize.w)
    .attr('height', SVGsize.h);

const containerG = svg.append('g')
    .attr('transform', `translate(${margins.l}, ${margins.t})`);
const dispatch = d3.dispatch('updateChart');


let data;

Promise.all([
d3.csv('data/population.csv'),
d3.csv('data/UNSD.csv')]).then(function(d) {
    let popData = d[0];
    let countryInfo = d[1];

    data = processData(popData, countryInfo);

    updateMenu(data);

//CREATING BAR CHART

let chart = new lineChart();
chart.data(data)
    .margin(margins)
    .size(SVGsize)
    .selection(containerG)
    .dispatch(dispatch)
    .draw();

//CHANGING MODE

    d3.selectAll('button').on('click', function(e){
        d3.selectAll('button').classed('active', false);        
        d3.select(this).classed('active', true);

        let mode = d3.select('.active').property('value');
        updateMenu(data, mode);

        let region;
        if(mode == 'country') region = 'United States';
        else if(mode == 'continent') region = 'Americas';
        else if(mode == 'subRegion')region = 'Northern America';

        dispatch.call('updateChart', this, mode, region);
    });

//CHANGING CATEGORY

    d3.selectAll('select').on('change', function(e){
        let region = d3.select(this).property('value');
        let mode = d3.select('.active').property('value');
        console.log(mode, region);
        dispatch.call('updateChart', this, mode, region);
    })
});


//--------FUNCTIONS--------

//REFORMATTING DATA
function processData(d0, d1) {
    let newData = [];

    for(let d of d0){
        if(d1.some(ele => ele['ISO-alpha3 Code'] == d['Country Code'])){

            let newObj = {};
            let refData = d1.filter(ele => ele['ISO-alpha3 Code'] == d['Country Code'])[0];

            newObj.country = d['Country Name'];
            newObj.code = d['Country Code'];
            newObj.verifyCode = refData['ISO-alpha3 Code'];
            newObj.continent = refData['Region Name'];
            newObj.subRegion = refData['Sub-region Name'];

            if(refData['Developed / Developing Countries'] == 'Developed') newObj.isDeveloped = true;
            else newObj.isDeveloped = false;

            for(let i = 1960; i<=2019; i++) newObj[i] = +d[i];

            newData.push(newObj);

        } else continue;
    }
    return newData;
}

//UPDATING THE DROPDOWN MENU
function updateMenu(data, mode = 'continent'){
    if(mode == 'continent'){

        let options = new Set(data.map(d => d.continent));
        options = Array.from(options);
        addOptions(options);

    }else if(mode == 'subRegion'){

        let options = new Set(data.map(d => d.subRegion));
        options = Array.from(options);
        addOptions(options);

    }else{

        let options = new Set(data.map(d => d.country));
        options = Array.from(options);
        addOptions(options);
    }
}

//APPENDING OPTIONS
function addOptions(data){
    let selects = d3.selectAll('#options');
    let addOption = selects.selectAll('.items')
        .data(data)
        .join('option')
        .text(d => d)
        .attr('class', 'items')
        .attr('value', d => d)
        .property('selected', function(d){
            if(d == "United States") return d == "United States";
            if(d == "Americas") return d == "Americas";
            if(d == "Northern America") return d == "Northern America";
        });
}

