var distance = 0
var resolution = 0 // mm @10m
var selectet_scanner_id = null;



var resolution_changed = function(event) {
    //console.log('resolution_changed')
    resolution = event.value.newValue;
    $('#reolution_display').text(' : '+ event.value.newValue) 
    redraw_canvas();
}
var distace_changed = function(event) {
    distance = event.value.newValue;
    $('#distance_display').text(' : ' + event.value.newValue )
    redraw_canvas();
}
$('#scanner_selection').on('change', function() {

    selectet_scanner_id = Number($(this).find(":selected").val());
    update_scanner_view()
});
var calc_spotSize_at_distance = function(dist) {
    //Strahldivergenz nach Spotgröße am Objekt umrechnen
    current_scanner = get_current_scanner();
    beam_divergence = current_scanner["beam_divergence [mrad]"];
    beam_diameter = current_scanner["beam_diameter [mm]"]
    var alpha = beam_divergence / 1000 // mrad to rad
    var d_m = beam_diameter / 1000 // m to mm
    r = dist

    // http://handwerkerinfos-bgbau.de/tr/tros_2/anl2.htm
    spot_size_m = d_m + 2 * r * Math.tan(alpha / 2)
        //console.log("Spot_Size [mm]", spot_size_m * 1000)
    return spot_size_m
}

var calc_reesolution_at_distance = function(dist) {
    beta_rad = resolution / 1000 / 10 // mm to m and than m to rad
    resolution_at_scan_distance = dist * beta_rad; //m
    //console.log("Resolution at Distacne [mm]", resolution_at_scan_distance * 1000)
    return resolution_at_scan_distance
}
var calc_center_points = function(grid_size, canvas_size) {
    offset = canvas_size / 2 / grid_size
        //console.log(offset)
    positions = [offset]
    for (var i = 0; i < grid_size - 1; i++) {
        positions[i + 1] = positions[i] + offset * 2
    }
    return positions
}
var get_current_scanner = function() {
    return scanner_db.filter(function(index) {
        return index.id == selectet_scanner_id;
    })[0];
}
var update_scanner_view = function() {

    current_scanner = get_current_scanner()
    if (current_scanner["available resolutioin @10m [mm]"]) {

        //resolution_slider.bootstrapSlider("refresh");
        resolution_slider.bootstrapSlider('destroy');
        resolution_slider.slider({
            ticks: current_scanner["available resolutioin @10m [mm]"],

            ticks_snap_bounds: 400,
            scale: 'logarithmic',
            value: 0
        }).on('change', resolution_changed);
    }
}
$.each(scanner_db, function(index, val) {
    $("#scanner_selection").append($("<option />").val(val.id).text(val.name));
});

//var circle_size = 10;
var resolution_slider = $("#resolution_slider").bootstrapSlider()
    .on('change', resolution_changed);
//resolution_slider.bootstrapSlider('setValue',resolution)
var distance_slider = $("#distance_slider").bootstrapSlider()
    .on('change', distace_changed)

distance_slider.bootstrapSlider('setValue', distance)

function update_result_labels(res_m,spot_size_m) {
	$('#object_res_display').text((res_m*100).toFixed(2)+ " cm")
	$('#spot_size').text((spot_size_m*1000).toFixed(2)+ " mm")
}

var redraw_canvas = function() {
    var c = document.getElementById("canvas");

    //aspect ration from canvas to maximal diameter of a spot
    canvas_size_to_distance = c.width / calc_spotSize_at_distance(150)
        // 4 Spots should be drawn on 80% of the canvas
    resolution_size_soll_px = (c.width * 0.8) / 4
    resolution_m = calc_reesolution_at_distance(distance);
    resolution_px = resolution_m * canvas_size_to_distance;
    // the resolution should be adjusted so that 4 spots are drawn and the circel size is in
    // the same scale
    zoom_faktor = resolution_size_soll_px / resolution_px;
    canvas_size_to_distance *= zoom_faktor

    resolution_px = resolution_m * canvas_size_to_distance

    spot_size_m = calc_spotSize_at_distance(distance)
    radius_m = spot_size_m / 2
    radius_px = radius_m * canvas_size_to_distance

    update_result_labels(resolution_m,spot_size_m)


    var ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height)
    center_positions = [1, 2, 3, 4]
    for (var i = 0; i < center_positions.length; i++) {
        for (var j = 0; j < center_positions.length; j++) {
            pos_x = resolution_px * center_positions[i];
            pos_y = resolution_px * center_positions[j];

            ctx.beginPath();
            ctx.arc(pos_x, pos_y, radius_px, 0, 2 * Math.PI);
            ctx.fillStyle = '#0B8BCC';
            ctx.globalAlpha = 0.3;
            ctx.fill();
            ctx.stroke();

            if (i == 0 && j == 0) {
                next_pos_x = pos_x + resolution_px
                next_pos_y = pos_y
                ctx.globalAlpha = 1;
                ctx.beginPath();
                ctx.moveTo(pos_x, pos_y);
                ctx.lineTo(next_pos_x, next_pos_y);
                ctx.stroke();
                ctx.fillStyle = "black"
                ctx.font = "15px Arial"
                resolution_string = (resolution_m * 100).toFixed(2) + " cm"
                ctx.fillText(resolution_string, pos_x+3, pos_y - 3)
            }
        }
    }

}
