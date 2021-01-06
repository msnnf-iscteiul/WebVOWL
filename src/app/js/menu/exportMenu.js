/**
 * Contains the logic for the export button.
 * @returns {{}}
 */
module.exports = function ( graph ){
  
  var exportMenu = {},
    exportFilename,
    exportJsonButton,
    exportTurtleButton,
    copyButton,
    exportableJsonText;
  
  var exportTTLModule = require("./exportTTLModule")(graph);
  
  String.prototype.replaceAll = function ( search, replacement ){
    var target = this;
    return target.split(search).join(replacement);
  };
  
  /**
   * Adds the export button to the website.
   */
  exportMenu.setup = function (){
    exportJsonButton = d3.select("#exportJson")
      .on("click", exportJson);
    
    copyButton = d3.select("#copyBt")
      .on("click", copyUrl);
    
    exportTurtleButton = d3.select("#exportTurtle")
      .on("click", exportTurtle);
    
    var menuEntry = d3.select("#m_export");
    menuEntry.on("mouseover", function (){
      var searchMenu = graph.options().searchMenu();
      searchMenu.hideSearchEntries();
      exportMenu.exportAsUrl();
    });
  };
  function exportTurtle(){
    var success = exportTTLModule.requestExport();
    var result = exportTTLModule.resultingTTL_Content();
    var ontoTitle = "NewOntology";
    console.log("Exporter was successful: " + success);
    if ( success ) {
      // console.log("The result is : " + result);
      // var ontoTitle=graph.options().getGeneralMetaObjectProperty('title');
      // if (ontoTitle===undefined || ontoTitle.length===0)
      // 	ontoTitle="NewOntology";
      // else{
      // 	// language object -.-
      //    ontoTitle.replace(" ","_")
      // }
      
      // TODO: show TEXT in warning module?
      
      
      // // write the data
      var dataURI = "data:text/json;charset=utf-8," + encodeURIComponent(result);
      
      exportTurtleButton.attr("href", dataURI)
        .attr("download", ontoTitle + ".ttl");
      
      // okay restore old href?
      //  exportTurtleButton.attr("href", oldHref);
    } else {
      console.log("ShowWarning!");
      graph.options().warningModule().showExporterWarning();
      console.log("Stay on the page! " + window.location.href);
      exportTurtleButton.attr("href", window.location.href);
      d3.event.preventDefault(); // prevent the href to be called ( reloads the page otherwise )
    }
  }
  
  exportMenu.setFilename = function ( filename ){
    exportFilename = filename || "export";
  };
  
  exportMenu.setJsonText = function ( jsonText ){
    exportableJsonText = jsonText;
  };
  
  function copyUrl(){
    d3.select("#exportedUrl").node().focus();
    d3.select("#exportedUrl").node().select();
    document.execCommand("copy");
    graph.options().navigationMenu().hideAllMenus();
    d3.event.preventDefault(); // prevent the href to be called ( reloads the page otherwise )
  }
  
  function prepareOptionString( defOpts, currOpts ){
    var setOptions = 0;
    var optsString = "opts=";
    
    for ( var name in defOpts ) {
      // define key and value ;
      if ( defOpts.hasOwnProperty(name) ) {// for travis warning
        var def_value = defOpts[name];
        var cur_value = currOpts[name];
        if ( def_value !== cur_value ) {
          optsString += name + "=" + cur_value + ";";
          setOptions++;
        }
      }
    }
    optsString += "";
    if ( setOptions === 0 ) {
      return "";
    }
    return optsString;
  }
  
  exportMenu.exportAsUrl = function (){
    var currObj = {};
    currObj.sidebar = graph.options().sidebar().getSidebarVisibility();
    
    // identify default value given by ontology;
    var defOntValue = graph.options().filterMenu().getDefaultDegreeValue();
    var currentValue = graph.options().filterMenu().getDegreeSliderValue();
    if ( parseInt(defOntValue) === parseInt(currentValue) ) {
      currObj.doc = -1;
    } else {
      currObj.doc = currentValue;
    }
    
    currObj.cd = graph.options().classDistance();
    currObj.dd = graph.options().datatypeDistance();
    if ( graph.editorMode() === true ) {
      currObj.editorMode = "true";
    } else {
      currObj.editorMode = "false";
    }
    currObj.filter_datatypes = String(graph.options().filterMenu().getCheckBoxValue("datatypeFilterCheckbox"));
    currObj.filter_sco = String(graph.options().filterMenu().getCheckBoxValue("subclassFilterCheckbox"));
    currObj.filter_disjoint = String(graph.options().filterMenu().getCheckBoxValue("disjointFilterCheckbox"));
    currObj.filter_setOperator = String(graph.options().filterMenu().getCheckBoxValue("setoperatorFilterCheckbox"));
    currObj.filter_objectProperties = String(graph.options().filterMenu().getCheckBoxValue("objectPropertyFilterCheckbox"));
    currObj.mode_dynamic = String(graph.options().dynamicLabelWidth());
    currObj.mode_scaling = String(graph.options().modeMenu().getCheckBoxValue("nodescalingModuleCheckbox"));
    currObj.mode_compact = String(graph.options().modeMenu().getCheckBoxValue("compactnotationModuleCheckbox"));
    currObj.mode_colorExt = String(graph.options().modeMenu().getCheckBoxValue("colorexternalsModuleCheckbox"));
    currObj.mode_multiColor = String(graph.options().modeMenu().colorModeState());
    currObj.mode_pnp = String(graph.options().modeMenu().getCheckBoxValue("pickandpinModuleCheckbox"));
    currObj.debugFeatures = String(!graph.options().getHideDebugFeatures());
    currObj.rect = 0;
    
    var defObj = graph.options().initialConfig();
    var optsString = prepareOptionString(defObj, currObj);
    var urlString = String(location);
    var htmlElement;
    // when everything is default then there is nothing to write
    if ( optsString.length === 0 ) {
      // building up parameter list;
      
      // remove the all options form location
      var hashCode = location.hash;
      urlString = urlString.split(hashCode)[0];
      
      var lPos = hashCode.lastIndexOf("#");
      if ( lPos === -1 ) {
        htmlElement = d3.select("#exportedUrl").node();
        htmlElement.value = String(location);
        htmlElement.title = String(location);
        return;  // nothing to change in the location String
      }
      var newURL = hashCode.slice(lPos, hashCode.length);
      htmlElement = d3.select("#exportedUrl").node();
      htmlElement.value = urlString + newURL;
      htmlElement.title = urlString + newURL;
      return;
    }
    
    // generate the options string;
    var numParameters = (urlString.match(/#/g) || []).length;
    var newUrlString;
    if ( numParameters === undefined || numParameters === 0 ) {
      newUrlString = urlString + "#" + optsString;
    }
    if ( numParameters > 0 ) {
      var tokens = urlString.split("#");
      var i;
      if ( tokens[1].indexOf("opts=") >= 0 ) {
        tokens[1] = optsString;
        newUrlString = tokens[0];
      } else {
        newUrlString = tokens[0] + "#";
        newUrlString += optsString;
      }
      // append parameters
      for ( i = 1; i < tokens.length; i++ ) {
        if ( tokens[i].length > 0 ) {
          newUrlString += "#" + tokens[i];
        }
      }
    }
    // building up parameter list;
    htmlElement = d3.select("#exportedUrl").node();
    htmlElement.value = newUrlString;
    htmlElement.title = newUrlString;
  };
  
  function shouldntChangeInlineCss( element, style ){
    return style === "fill" && hasBackgroundColorSet(element);
  }
  
  function hasBackgroundColorSet( element ){
    var data = element.datum();
    if ( data === undefined ) {
      return false;
    }
    return data.backgroundColor && !!data.backgroundColor();
  }
  
  exportMenu.createJSON_exportObject = function (){
    var i, j, k; // an index variable for the for-loops
    
    /** get data for exporter **/
      if (!graph.options().data()) {return {};} // return an empty json object
      // extract onotology information;
    var unfilteredData = graph.getUnfilteredData();
    var ontologyComment = graph.options().data()._comment;
    var metaObj = graph.options().getGeneralMetaObject();
    var header = graph.options().data().header;
    
    if ( metaObj.iri && metaObj.iri !== header.iri ) {
      header.iri = metaObj.iri;
    }
    if ( metaObj.title && metaObj.title !== header.title ) {
      header.title = metaObj.title;
    }
    if ( metaObj.version && metaObj.version !== header.version ) {
      header.version = metaObj.version;
    }
    if ( metaObj.author && metaObj.author !== header.author ) {
      header.author = metaObj.author;
    }
    if ( metaObj.description && metaObj.description !== header.description ) {
      header.description = metaObj.description;
    }
    
    
    var exportText = {};
    exportText._comment = ontologyComment;
    exportText.header = header;
    exportText.namespace = graph.options().data().namespace;
    if ( exportText.namespace === undefined ) {
      exportText.namespace = []; // just an empty namespace array
    }
    // we do have now the unfiltered data which needs to be transfered to class/classAttribute and property/propertyAttribute
    
    
    // var classAttributeString='classAttribute:[ \n';
    var nodes = unfilteredData.nodes;
    var nLen = nodes.length; // hope for compiler unroll
    var classObjects = [];
    var classAttributeObjects = [];
    for ( i = 0; i < nLen; i++ ) {
      var classObj = {};
      var classAttr = {};
      classObj.id = nodes[i].id();
      classObj.type = nodes[i].type();
      classObjects.push(classObj);
      
      // define the attributes object
      classAttr.id = nodes[i].id();
      classAttr.iri = nodes[i].iri();
      classAttr.baseIri = nodes[i].baseIri();
      classAttr.label = nodes[i].label();
      
      if ( nodes[i].attributes().length > 0 ) {
        classAttr.attributes = nodes[i].attributes();
      }
      if ( nodes[i].comment() ) {
        classAttr.comment = nodes[i].comment();
      }
      if ( nodes[i].annotations() ) {
        classAttr.annotations = nodes[i].annotations();
      }
      if ( nodes[i].description() ) {
        classAttr.description = nodes[i].description();
      }
      
      
      if ( nodes[i].individuals().length > 0 ) {
        var classIndividualElements = [];
        var nIndividuals = nodes[i].individuals();
        for ( j = 0; j < nIndividuals.length; j++ ) {
          var indObj = {};
          indObj.iri = nIndividuals[j].iri();
          indObj.baseIri = nIndividuals[j].baseIri();
          indObj.labels = nIndividuals[j].label();
          if ( nIndividuals[j].annotations() ) {
            indObj.annotations = nIndividuals[j].annotations();
          }
          if ( nIndividuals[j].description() ) {
            indObj.description = nIndividuals[j].description();
          }
          if ( nIndividuals[j].comment() ) {
            indObj.comment = nIndividuals[j].comment();
          }
          classIndividualElements.push(indObj);
        }
        classAttr.individuals = classIndividualElements;
      }
      
      var equalsForAttributes = undefined;
      if ( nodes[i].equivalents().length > 0 ) {
        equalsForAttributes = [];
        var equals = nodes[i].equivalents();
        for ( j = 0; j < equals.length; j++ ) {
          var eqObj = {};
          var eqAttr = {};
          eqObj.id = equals[j].id();
          equalsForAttributes.push(equals[j].id());
          eqObj.type = equals[j].type();
          classObjects.push(eqObj);
          
          eqAttr.id = equals[j].id();
          eqAttr.iri = equals[j].iri();
          eqAttr.baseIri = equals[j].baseIri();
          eqAttr.label = equals[j].label();
          
          if ( equals[j].attributes().length > 0 ) {
            eqAttr.attributes = equals[j].attributes();
          }
          if ( equals[j].comment() ) {
            eqAttr.comment = equals[j].comment();
          }
          if ( equals[j].individuals().length > 0 ) {
            eqAttr.individuals = equals[j].individuals();
          }
          if ( equals[j].annotations() ) {
            eqAttr.annotations = equals[j].annotations();
          }
          if ( equals[j].description() ) {
            eqAttr.description = equals[j].description();
          }
          console.log(equals[j]);
          if ( equals[j].individuals().length > 0 ) {
            var e_classIndividualElements = [];
            console.log(equals[i]);
            var e_nIndividuals = equals[j].individuals();
            for ( k = 0; k < e_nIndividuals.length; k++ ) {
              var e_indObj = {};
              e_indObj.iri = e_nIndividuals[k].iri();
              e_indObj.baseIri = e_nIndividuals[k].baseIri();
              e_indObj.labels = e_nIndividuals[k].label();
              
              if ( e_nIndividuals[k].annotations() ) {
                e_indObj.annotations = e_nIndividuals[k].annotations();
              }
              if ( e_nIndividuals[k].description() ) {
                e_indObj.description = e_nIndividuals[k].description();
              }
              if ( e_nIndividuals[k].comment() ) {
                e_indObj.comment = e_nIndividuals[k].comment();
              }
              e_classIndividualElements.push(e_indObj);
            }
            eqAttr.individuals = e_classIndividualElements;
          }
          
          classAttributeObjects.push(eqAttr);
        }
      }
      if ( equalsForAttributes && equalsForAttributes.length > 0 ) {
        classAttr.equivalent = equalsForAttributes;
      }
      
      // classAttr.subClasses=nodes[i].subClasses(); // not needed
      // classAttr.instances=nodes[i].instances();
      
      //
      // .complement(element.complement)
      // .disjointUnion(element.disjointUnion)
      // .description(element.description)
      // .equivalents(element.equivalent)
      // .intersection(element.intersection)
      // .type(element.type) Ignore, because we predefined it
      // .union(element.union)
      classAttributeObjects.push(classAttr);
    }
    
    /** -- properties -- **/
    var properties = unfilteredData.properties;
    var pLen = properties.length; // hope for compiler unroll
    var propertyObjects = [];
    var propertyAttributeObjects = [];
    
    for ( i = 0; i < pLen; i++ ) {
      var pObj = {};
      var pAttr = {};
      pObj.id = properties[i].id();
      pObj.type = properties[i].type();
      propertyObjects.push(pObj);
      
      // // define the attributes object
      pAttr.id = properties[i].id();
      pAttr.iri = properties[i].iri();
      pAttr.baseIri = properties[i].baseIri();
      pAttr.label = properties[i].label();
      
      if ( properties[i].attributes().length > 0 ) {
        pAttr.attributes = properties[i].attributes();
      }
      if ( properties[i].comment() ) {
        pAttr.comment = properties[i].comment();
      }
      
      if ( properties[i].annotations() ) {
        pAttr.annotations = properties[i].annotations();
      }
      if ( properties[i].maxCardinality() ) {
        pAttr.maxCardinality = properties[i].maxCardinality();
      }
      if ( properties[i].minCardinality() ) {
        pAttr.minCardinality = properties[i].minCardinality();
      }
      if ( properties[i].cardinality() ) {
        pAttr.cardinality = properties[i].cardinality();
      }
      if ( properties[i].description() ) {
        pAttr.description = properties[i].description();
      }
      
      pAttr.domain = properties[i].domain().id();
      pAttr.range = properties[i].range().id();
      // sub properties;
      if ( properties[i].subproperties() ) {
        var subProps = properties[i].subproperties();
        var subPropsIdArray = [];
        for ( j = 0; j < subProps.length; j++ ) {
          if ( subProps[j].id )
            subPropsIdArray.push(subProps[j].id());
        }
        pAttr.subproperty = subPropsIdArray;
      }
      
      // super properties
      if ( properties[i].superproperties() ) {
        var superProps = properties[i].superproperties();
        var superPropsIdArray = [];
        for ( j = 0; j < superProps.length; j++ ) {
          if ( superProps[j].id )
            superPropsIdArray.push(superProps[j].id());
        }
        pAttr.superproperty = superPropsIdArray;
      }
      
      // check for inverse element
      if ( properties[i].inverse() ) {
        if ( properties[i].inverse().id )
          pAttr.inverse = properties[i].inverse().id();
      }
      propertyAttributeObjects.push(pAttr);
    }
    
    exportText.class = classObjects;
    exportText.classAttribute = classAttributeObjects;
    exportText.property = propertyObjects;
    exportText.propertyAttribute = propertyAttributeObjects;
    
    
    var nodeElements = graph.graphNodeElements();  // get visible nodes
    var propElements = graph.graphLabelElements(); // get visible labels
    // var jsonObj = JSON.parse(exportableJsonText);	   // reparse the original input json
    
    /** modify comment **/
    var comment = exportText._comment;
    var additionalString = " [Additional Information added by WebVOWL Exporter Version: " + "@@WEBVOWL_VERSION" + "]";
    // adding new string to comment only if it does not exist
    if ( comment.indexOf(additionalString) === -1 ) {
      exportText._comment = comment + " [Additional Information added by WebVOWL Exporter Version: " + "@@WEBVOWL_VERSION" + "]";
    }
    
    var classAttribute = exportText.classAttribute;
    var propAttribute = exportText.propertyAttribute;
    /**  remove previously stored variables **/
    for ( i = 0; i < classAttribute.length; i++ ) {
      var classObj_del = classAttribute[i];
      delete classObj_del.pos;
      delete classObj_del.pinned;
    }
    var propertyObj;
    for ( i = 0; i < propAttribute.length; i++ ) {
      propertyObj = propAttribute[i];
      delete propertyObj.pos;
      delete propertyObj.pinned;
    }
    /**  add new variables to jsonObj  **/
    // class attribute variables
    nodeElements.each(function ( node ){
      var nodeId = node.id();
      for ( i = 0; i < classAttribute.length; i++ ) {
        var classObj = classAttribute[i];
        if ( classObj.id === nodeId ) {
          // store relative positions
          classObj.pos = [parseFloat(node.x.toFixed(2)), parseFloat(node.y.toFixed(2))];
          if ( node.pinned() )
            classObj.pinned = true;
          break;
        }
      }
    });
    // property attribute variables
    for ( j = 0; j < propElements.length; j++ ) {
      var correspondingProp = propElements[j].property();
      for ( i = 0; i < propAttribute.length; i++ ) {
        propertyObj = propAttribute[i];
        if ( propertyObj.id === correspondingProp.id() ) {
          propertyObj.pos = [parseFloat(propElements[j].x.toFixed(2)), parseFloat(propElements[j].y.toFixed(2))];
          if ( propElements[j].pinned() )
            propertyObj.pinned = true;
          break;
        }
      }
    }
    /** create the variable for settings and set their values **/
    exportText.settings = {};
    
    // Global Settings
    var zoom = graph.scaleFactor();
    var paused = graph.paused();
    var translation = [parseFloat(graph.translation()[0].toFixed(2)), parseFloat(graph.translation()[1].toFixed(2))];
    exportText.settings.global = {};
    exportText.settings.global.zoom = zoom.toFixed(2);
    exportText.settings.global.translation = translation;
    exportText.settings.global.paused = paused;
    
    // shared variable declaration
    var cb_text;
    var isEnabled;
    var cb_obj;
    
    // Gravity Settings
    var classDistance = graph.options().classDistance();
    var datatypeDistance = graph.options().datatypeDistance();
    exportText.settings.gravity = {};
    exportText.settings.gravity.classDistance = classDistance;
    exportText.settings.gravity.datatypeDistance = datatypeDistance;
    
    // Filter Settings
    var fMenu = graph.options().filterMenu();
    var fContainer = fMenu.getCheckBoxContainer();
    var cbCont = [];
    for ( i = 0; i < fContainer.length; i++ ) {
      cb_text = fContainer[i].checkbox.attr("id");
      isEnabled = fContainer[i].checkbox.property("checked");
      cb_obj = {};
      cb_obj.id = cb_text;
      cb_obj.checked = isEnabled;
      cbCont.push(cb_obj);
    }
    var degreeSliderVal = fMenu.getDegreeSliderValue();
    exportText.settings.filter = {};
    exportText.settings.filter.checkBox = cbCont;
    exportText.settings.filter.degreeSliderValue = degreeSliderVal;
    
    // Modes Settings
    var mMenu = graph.options().modeMenu();
    var mContainer = mMenu.getCheckBoxContainer();
    var cb_modes = [];
    for ( i = 0; i < mContainer.length; i++ ) {
      cb_text = mContainer[i].attr("id");
      isEnabled = mContainer[i].property("checked");
      cb_obj = {};
      cb_obj.id = cb_text;
      cb_obj.checked = isEnabled;
      cb_modes.push(cb_obj);
    }
    var colorSwitchState = mMenu.colorModeState();
    exportText.settings.modes = {};
    exportText.settings.modes.checkBox = cb_modes;
    exportText.settings.modes.colorSwitchState = colorSwitchState;
    
    var exportObj = {};
    // todo: [ ] find better way for ordering the objects
    // hack for ordering of objects, so settings is after metrics
    exportObj._comment = exportText._comment;
    exportObj.header = exportText.header;
    exportObj.namespace = exportText.namespace;
    exportObj.metrics = exportText.metrics;
    exportObj.settings = exportText.settings;
    exportObj.class = exportText.class;
    exportObj.classAttribute = exportText.classAttribute;
    exportObj.property = exportText.property;
    exportObj.propertyAttribute = exportText.propertyAttribute;
    
    return exportObj;
  };
  
  function exportJson(){
    graph.options().navigationMenu().hideAllMenus();
    /**  check if there is data **/
    if ( !exportableJsonText ) {
      alert("No graph data available.");
      // Stop the redirection to the path of the href attribute
      d3.event.preventDefault();
      return;
    }
    
    var exportObj = exportMenu.createJSON_exportObject();
    
    // make a string again;
    var exportText = JSON.stringify(exportObj, null, '  ');
    // write the data
    var dataURI = "data:text/json;charset=utf-8," + encodeURIComponent(exportText);
    var jsonExportFileName = exportFilename;
    
    if ( !jsonExportFileName.endsWith(".json") )
      jsonExportFileName += ".json";
    exportJsonButton.attr("href", dataURI)
      .attr("download", jsonExportFileName);
  }
  
  var curveFunction = d3.svg.line()
    .x(function ( d ){
      return d.x;
    })
    .y(function ( d ){
      return d.y;
    })
    .interpolate("cardinal");
  var loopFunction = d3.svg.line()
    .x(function ( d ){
      return d.x;
    })
    .y(function ( d ){
      return d.y;
    })
    .interpolate("cardinal")
    .tension(-1);
  
  function calculateRadian( angle ){
    angle = angle % 360;
    if ( angle < 0 ) {
      angle = angle + 360;
    }
    return (Math.PI * angle) / 180;
  }
  
  function calculateAngle( radian ){
    return radian * (180 / Math.PI);
  }
  
  return exportMenu;
};
