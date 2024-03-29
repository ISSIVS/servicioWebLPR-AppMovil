/*
 * READ THIS
 * You should change of course the ip addresses for the vars of postgresql connections
 * You should create the coordinates database and fill with data of the actually used recognizers
 * You should add the following lines to the C:\Program Files (x86)\ISS\SecurOS\Modules\http_event_proxy\paths.txt file:
 
	/set-view
	/set-alta
	/set-baja
	/get-plate
	/get-blacklist
	/get-whitelist
	/insert-comments
*/

function Init(){
    Core.RegisterEventHandler("HTTP_EVENT_PROXY","2","PENDING_REQUEST","RESPONSE_TO_HTTP");
        
}
function RESPONSE_TO_HTTP(e){
    
    Log.Debug("It Entered");
    var Cnxn = new ActiveXObject("ADODB.Connection");
    var Cnxn2 = new ActiveXObject("ADODB.Connection");
    var CnxnCommand = new ActiveXObject("ADODB.Command");
    var CnxnRecord = new ActiveXObject("ADODB.Recordset");
    var CnxnRecord2 = new ActiveXObject("ADODB.Recordset");
    var Connectext = "DATABASE=ext;DRIVER={PostgreSQL Unicode};PORT=5432;PWD=postgres;SERVER=192.168.15.101;UID=postgres;";
    var ConnectLPRCAM = "DATABASE=securos;DRIVER={PostgreSQL Unicode};PORT=5432;PWD=postgres;SERVER=192.168.15.101;UID=postgres;";
    var ConnectAuto = "DATABASE=auto;DRIVER={PostgreSQL Unicode};PORT=5432;PWD=postgres;SERVER=192.168.15.101;UID=postgres;";
    var ConnectCoordenadas = "DATABASE=coordenadas;DRIVER={PostgreSQL Unicode};PORT=5432;PWD=postgres;SERVER=localhost;UID=postgres;";
    var identificador = e._id;
    var cantidadResultados = 0;
    var respuesta;
    var guid = ""; 

//Changing securos message GUID
    for(var it = 0;it<e._id.length;it++)
    {
        Log.Debug(e._id[it]);
        if(e._id[it] != "{" && e._id[it]!= "}"){

            guid += e._id[it].toString();
            Log.Debug(guid);
        }
    }

    if(e._path == "/set-view"){
        
        if(e.reconocedores == "alta"){
            try
            {
		    
		//Starts to build response message
                respuesta = "{\"notificacion\":\"reconocedores\",\"structure\":[";
		    
                var query="select name, id from \"OBJ_LPR_CAM\"";
                Log.Debug(query);
                Cnxn.open(ConnectLPRCAM);
                CnxnRecord.open(query,Cnxn);
                CnxnRecord.MoveFirst;
					
                while (!CnxnRecord.eof)
                {
						Cnxn2 = new ActiveXObject("ADODB.Connection");
						CnxnRecord2 = new ActiveXObject("ADODB.Recordset");
						                    Log.Debug(cantidadResultados);
						Cnxn2.open(ConnectCoordenadas);
						                    Log.Debug(CnxnRecord.Fields("name").Value);
						CnxnRecord2.open("select * from coordenadas where \"id\" = " + CnxnRecord.Fields("id").Value, Cnxn2);


                    Log.Debug(CnxnRecord.Fields("id").Value);

                    if(cantidadResultados > 0)
                    {
                        respuesta += ","
                    }
			
		    //Add matches to response message
                    respuesta += "{ \"nombre\" : \""+CnxnRecord.Fields("name").Value+"\",\"id\" : \""+CnxnRecord.Fields("id").Value+"\", \"latitud\":\""+CnxnRecord2.Fields("latitud").Value+"\",\"longitud\":\""+CnxnRecord2.Fields("longitud").Value+"\"}";

                    cantidadResultados++;
						Cnxn2.Close();
                    CnxnRecord.MoveNext;
                }
                
		//Finish response message
                respuesta += "],\"recepcion\":\"ok\",\"guid\":\""+guid+"\"}";
                Cnxn.Close();   
                
            }
            catch(exception)
            {
                Cnxn.Close();
					Log.Debug(exception);
		//Replace response to nok when exception
                respuesta = "{\"recepcion\":\"nok\",\"guid\":\""+guid+"\"}";
            }    
            
        }
        else
        {
	    //Missing parameters error
            respuesta = "{\"notificacion\":\"Error\",\"descripcion\":\"Ingreso erroneo de datos\"}"
        }
        
        Log.Debug(respuesta);
        

    }else if(e._path == "/set-alta"){
        
        if((e.placa != null || e.database != null) && (e.database == "whitelist" || e.database == "blacklist"))
        {
		//Assuming a plate is at least 5 characters long
            if(e.placa.length >= 5)
            {
                var folio = "";
            
               Log.Debug(guid);
                
                try
                {
                    if(e.folioIncidente != null){
                        folio = e.folioIncidente;
                    }else{
                        folio = guid;
                    }
                    var query;
                    if(e.database == "blacklist")
                    {
                        query="INSERT INTO black( number, comment) VALUES ('"+e.placa+"','"+folio+"')";
                    }else if(e.database == "whitelist")
                    {
                        query="INSERT INTO white( number, comment) VALUES ('"+e.placa+"','"+folio+"')";
                    }
                    
                    
                    Log.Debug(query);
                    Cnxn.Open(Connectext);
                    CnxnCommand.CommandText = query;        
                    CnxnCommand.ActiveConnection = Cnxn;
                    CnxnRecord = Cnxn.Execute(query);
                    Cnxn.Close();
			
		    //Response message
                    respuesta = "{\"recepcion\":\"ok\",\"guid\":\""+guid+"\"}";

                }
                catch(exception)
                {
                    Cnxn.Close();       
		    //Replace response to nok when exception
                    respuesta = "{\"recepcion\":\"nok\",\"guid\":\""+guid+"\"}";
                }
            }
            else
            {
		    //Missing parameters error
                respuesta = "{\"notificacion\":\"Error\",\"descripcion\":\"Ingreso erroneo de datos\"}"
            }
        }
        else
        {
		//Missing parameters error
            respuesta = "{\"notificacion\":\"Error\",\"descripcion\":\"Ingreso erroneo de datos\"}"
        }
        
        
        Log.Debug(respuesta);
        
    }else if(e._path == "/set-baja"){
        
        Log.Debug(guid);

       //Assuming a plate is at least 5 characters long
        if((e.placa != null && e.placa.length >= 5 && e.database != null) && (e.database == "whitelist" || e.database == "blacklist"))
        {

           try
           {
               var query;
               if(e.database == "whitelist")
               {
                   query="DELETE FROM white WHERE number = '" + e.placa + "'";
               }else if(e.database == "blacklist")
               {
                   query="DELETE FROM black WHERE number = '" + e.placa + "'";
               }
                
                Log.Debug(query);
                Cnxn.Open(Connectext);
                CnxnCommand.CommandText = query;        
                CnxnCommand.ActiveConnection = Cnxn;
                CnxnRecord = Cnxn.Execute(query);
                Cnxn.Close();
                Log.Debug("Ok...");
		   
		//Response message
                respuesta = "{\"recepcion\":\"ok\",\"guid\":\""+guid+"\"}";

           }catch(exception)
            {
                Cnxn.Close();       
		    //Replace response to nok when exception
                respuesta = "{\"recepcion\":\"nok\",\"guid\":\""+guid+"\"}";
            }   
        }
        else
        {
		//Missing parameters error
            respuesta = "{\"notificacion\":\"Error\",\"descripcion\":\"Ingreso erroneo de datos\"}";
        }

        
        Log.Debug(respuesta);
        
    }else if(e._path == "/get-plate"){
        
        var placa, fechaInicio, fechaFin, idArco;
        var success = false;
        var query;
        
        Log.Debug(guid);

        if(e.placa != null){
            switch(e.placa.length){
                case 0:
                    success = false;
                    break;
                default:
                    success = true;
                    placa = e.placa;
                    break;
            }
        }
        else
        {
            if(e.justDate != null)
            {
                if(e.justDate == "true"){
                    success = true;
                }else{
                  success=false;  
                } 
            }else
            success = false;
        }
        
        
        if(success)
        {

            //Obtain start date
            if(e.fechaInicio != null){
            
                switch(e.fechaInicio.length)
                {
                    case 0:
			//No filter case
                        fechaInicio = "localtimestamp - interval '30 days'";
                        break;
                    default:
                        fechaInicio = "'" + e.fechaInicio + "'";
                        break;
                }    
            }else
            {
		    //No filter case
                fechaInicio = "localtimestamp - interval '30 days'";
            }
            

            //Obtain end date
            if(e.fechaFin != null)
            {
		if(e.fechaFin.length > 6)
		{
			fechaFin = "'" + e.fechaFin + "'";
		}else
		{
			switch(e.fechaFin.length)
	                {
	                    case 0:
					//No filter case
        	                fechaFin = "localtimestamp";
                	        break;
	                    default:
	                        fechaFin = "'" + e.fechaFin + "'::date + interval '1 days'";
	                        break;
        	        }    
		}
                
            }
            else
            {
		    //No filter case
                fechaFin = "localtimestamp";
            }

            
            //Start building the query
            
            query = "select * from t_log where time_best >= " + fechaInicio + " AND time_best <= " + fechaFin + " AND strpos(plate_recognized,upper('" + placa + "')) = 1" ;
            var queryImage = "";

	    //Obtain Recognizer ID and add it to the query in that specific order
	    //If not specified or asterisk is used, no recognizer filter will be added
            if(e.idArco != null)
            {
                if(e.idArco.length > 0 && e.idArco != "*")
                {
                    idArco = e.idArco;
                    //queryImage += "AND lpr_id = '" + idArco + "'";
                    query += "AND lpr_id = '" + idArco + "'";
                }    
            }

            //Finish building the query
            query += " order by time_best";



            try
            {
		    //Start building response
                respuesta = "{\"structure\":[";
                
                Log.Debug(query);
                Cnxn.open(ConnectAuto);
                CnxnRecord.open(query,Cnxn);
                Log.Debug(CnxnRecord.eof + " ... " + CnxnRecord.bof);
                CnxnRecord.MoveFirst;
				Log.Debug(CnxnRecord.eof + " ... " + CnxnRecord.bof);

                var iteration = 0;
                var tid = "";
                
                 //No image option
                    if(e.justDate == "true")
                    {
                        Log.Debug("Working");
			    
			    //Limit set to 100... could be changed to a variable
                        while (!CnxnRecord.eof && cantidadResultados <= 100)
                        {
                            Log.Debug(cantidadResultados);
                            Log.Debug(CnxnRecord.Fields("lpr_name").Value);
                            Log.Debug(CnxnRecord.Fields("time_best").Value);
                            Log.Debug(CnxnRecord.Fields("plate_recognized").Value);

  						    tid = CnxnRecord.Fields("tid").Value;

                            if(cantidadResultados > 0)
                            {
                                respuesta += ","
                            }
                    
					
                            Log.Debug("Respuesta: " + respuesta);
				
			    //Fill the response message
                            respuesta += "{ \"tid\":\"" + CnxnRecord.Fields("tid").Value + "\",\"nombre\" : \""+CnxnRecord.Fields("lpr_name").Value+"\",\"timeStamp\" : \""+CnxnRecord.Fields("time_best").Value+"\",\"placa\":\""+CnxnRecord.Fields("plate_recognized").Value + "\",\"direccion\":\""+CnxnRecord.Fields("direction_name").Value+"\",\"comentario\":\""+CnxnRecord.Fields("log_comment").Value+"\",\"recepcion\":\"ok\",\"guid\":\""+guid+"\"}";

                            cantidadResultados++;
                            CnxnRecord.MoveNext;
                        }
                    
                    
                }else{
		//Image option
                    var image;
                    Log.Debug(queryImage);
                    Cnxn2.open(ConnectAuto);
                    
                    while (!CnxnRecord.eof && cantidadResultados <= 100)
                    {    
                        Log.Debug(cantidadResultados);
                        Log.Debug(CnxnRecord.Fields("lpr_name").Value);
                        Log.Debug(CnxnRecord.Fields("time_best").Value);
                        Log.Debug(CnxnRecord.Fields("plate_recognized").Value);

                        tid = CnxnRecord.Fields("tid").Value;

                        if(cantidadResultados > 0)
                        {
                            respuesta += ","
                        }
			    
			//Query for the image, actually encoding to base64 directly from postgresql
                        queryImage = "SELECT encode(image, 'base64') from t_image where tid = " + tid; 
                        Log.Debug("Query image: " + queryImage);						

                        CnxnRecord2 = new ActiveXObject("ADODB.Recordset");
                        CnxnRecord2.open(queryImage,Cnxn2);

                        try
                        {
                            image = CnxnRecord2.Fields("encode").Value;
                            CnxnRecord2.Close();
                        }catch(Exception)
                        {
                            image = "";
                            CnxnRecord2.Close();
                        }


                         Log.Debug("Respuesta: " + respuesta);
                         Log.Debug("image: " + image);						
                         respuesta += "{ \"tid\":\"" + CnxnRecord.Fields("tid").Value + "\",\"nombre\" : \""+CnxnRecord.Fields("lpr_name").Value+"\",\"timeStamp\" : \""+CnxnRecord.Fields("time_best").Value+"\",\"placa\":\""+CnxnRecord.Fields("plate_recognized").Value + "\",\"direccion\":\""+CnxnRecord.Fields("direction_name").Value+"\",\"comentario\":\""+CnxnRecord.Fields("log_comment").Value+"\",\"imagen\":\""+image+"\", \"recepcion\":\"ok\",\"guid\":\""+guid+"\"}";

                        cantidadResultados++;
                        CnxnRecord.MoveNext;
                    }
                }
                Cnxn.Close();
		    
		    //Finish response message
                respuesta += "]}";
            }
            
            catch(exception)
            {
                Cnxn.Close();
					Log.Debug("Exception: " + exception);
		    //Replace response to nok when exception
                respuesta = "{\"recepcion\":\"nok\",\"guid\":\""+guid+"\"}";
                
            }

        }
        else
        {
		//Missing parameters error
            respuesta = "{\"notificacion\":\"Error\",\"descripcion\":\"Ingreso erroneo de datos\"}";
        }
        
        
        Log.Debug(respuesta);
        
    }else if(e._path == "/get-blacklist" || e._path == "/get-whitelist")
    {
        var query;
        var cantidadResultados = 0;
	  
	//Start building response
        var respuesta = "{\"placas\":[";
        if(e._path == "/get-blacklist")
        {
            query = "select \"number\" from black";
        }else{
            query = "select \"number\" from white";
        }
        
         try
         {
            Cnxn.open(Connectext);
            CnxnRecord.open(query,Cnxn);
            CnxnRecord.MoveFirst;
            while (!CnxnRecord.eof)
            {
                if(cantidadResultados > 0)
                {
                    respuesta += ","
                }
		    
		//Fill response message
                respuesta += "\""+CnxnRecord.Fields("number").Value + "\"";

                cantidadResultados++;
                CnxnRecord.MoveNext;
            }
            Cnxn.Close();   
         }
         catch(exception)
         {
		 //Replace response to nok when exception
             respuesta = "{\"recepcion\":\"nok\",\"guid\":\""+guid+"\"}";
         }
      //Finish response message
        respuesta += "],\"recepcion\":\"ok\",\"guid\":\""+guid+"\"}";
        
    }else if(e._path == "/insert-comments")
    {
		Log.Debug("tid: " + e.id);
        if(e.id != null)
        {
            try
            {
                var query = "UPDATE t_log SET log_comment='" + e.comentario + "' WHERE tid = '" + e.id + "'";
					Log.Debug("Query: " + query);
                Cnxn.open(ConnectAuto);
                CnxnCommand.CommandText = query;        
                CnxnCommand.ActiveConnection = Cnxn;
                CnxnRecord = Cnxn.Execute(query);
                Cnxn.Close();
		    
		    //Response message
					respuesta = "{\"recepcion\":\"ok\",\"guid\":\""+guid+"\"}";
            }
            catch(exception)
            {
		    //Replace response to nok when exception
                respuesta = "{\"recepcion\":\"nok\",\"guid\":\""+guid+"\"}";
            }
        }else
        {
		//Missing parameters error
            respuesta = "{\"notificacion\":\"Error\",\"descripcion\":\"Ingreso erroneo de datos\"}";
        }
    }

    // Send response to client
    Core.DoReact("HTTP_EVENT_PROXY","2","RESPONSE","_id",identificador,"_body",respuesta,"_content_type","application/json");
}
