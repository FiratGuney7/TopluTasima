[out:json][timeout:90];
(
  node(around:{{R}},{{LAT}},{{LON}})[highway=bus_stop];
  node(around:{{R}},{{LAT}},{{LON}})[public_transport=platform];
  way(around:{{R}},{{LAT}},{{LON}})[public_transport=platform];
  node(around:{{R}},{{LAT}},{{LON}})[public_transport=stop_position];
  node(around:{{R}},{{LAT}},{{LON}})[railway=tram_stop];
  node(around:{{R}},{{LAT}},{{LON}})[railway=halt];
  node(around:{{R}},{{LAT}},{{LON}})[railway=station];
)->.stops;
.stops out body center;
(rel(bn.stops)[type=route]; rel(bw.stops)[type=route];)->.routes;
.routes out geom({{BBOX}});
rel(br.routes)[type=route_master];
out body;
