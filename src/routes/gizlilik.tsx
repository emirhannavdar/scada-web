import {createFileRoute,redirect} from '@tanstack/react-router';
export const Route=createFileRoute('/gizlilik')({beforeLoad:({location})=>{throw redirect({href:'/privacy-policy'+location.searchStr,replace:true,statusCode:301});}});
