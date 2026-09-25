import type {Metadata} from 'next';
import ProposalView from './ProposalView';
export const metadata:Metadata={title:'Your personal travel proposal | Bucketlist Adventure',robots:{index:false,follow:false},referrer:'no-referrer'};
export const dynamic='force-dynamic';
export default async function ProposalPage({params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 return <ProposalView token={token}/>;
}
