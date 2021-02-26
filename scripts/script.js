const margins = {t: 50, r: 50, b: 50, l: 50};
const SVGsize = {w: window.innerWidth*0.8, h: window.innerHeight*0.8};
const size = {
    w: SVGsize.w - margins.l - margins.r,
    h: SVGsize.h - margins.t - margins.b
};
const svg = d3.select('svg')
    .attr('width', SVGsize.w)
    .attr('height', SVGsize.h);
const containerG = svg.append('g')
    .attr('transform', `translate(${margins.l}, ${margins.t})`);


let data, scaleY, scaleX, scaleDuration;

d3.csv('data/population.csv')
.then(function(d) {
    data = d;
    console.log(data[0]);
    data.forEach(parseData);
});

function parseData(d) {
}

function draw(data) {

}
