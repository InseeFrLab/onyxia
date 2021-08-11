/* eslint-disable @typescript-eslint/no-unused-vars */

import type { Get_Public_Catalog_CatalogId_PackageName } from "./OnyxiaApiClient";

type Unit = "Gi";

const simple: Get_Public_Catalog_CatalogId_PackageName.JSONSchemaFormFieldDescription.String.Slider.Simple<Unit> =
    {
        "sliderMin": 1,
        "sliderMax": 100,
        "type": "string",
        "render": "slider",
        "sliderUnit": "Gi",
        "sliderStep": 1,

        //Optional This might be used as helper text.
        //Shouldn't be present if the title is explanatory enough.
        "description": "Size of the persistent volume",

        //Optional. This will be the label of the slider,
        //if omitted it will be the last portion of the path, here "size"
        "title": "Persistent volume size",

        "default": "10Gi", //Optional default min
    };

const doubleDown: Get_Public_Catalog_CatalogId_PackageName.JSONSchemaFormFieldDescription.String.Slider.Range.Down<Unit> =
    {
        "sliderExtremity": "down",
        "sliderMin": 1,
        "sliderExtremitySemantic": "guaranteed",
        "title": "Random-Access-Memory (RAM)",
        "type": "string",
        "render": "slider",
        "sliderUnit": "Gi",
        "sliderStep": 1,
        "default": "2Gi", //Optional, default min
    };

const doubleUp: Get_Public_Catalog_CatalogId_PackageName.JSONSchemaFormFieldDescription.String.Slider.Range.Up<Unit> =
    {
        "sliderExtremity": "up",
        "sliderMax": 200,
        "sliderExtremitySemantic": "maximum",
        "title": "Random-Access-Memory (RAM)",
        "type": "string",
        "render": "slider",
        //"sliderUnit": "Gi", //inferred from "down"
        //"sliderStep": 1, //inferred from "down"
        "default": "2Gi", //Optional, default max
    } as any;
